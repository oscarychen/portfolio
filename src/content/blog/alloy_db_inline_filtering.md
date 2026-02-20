---
title: "Efficient hybrid search on vector database using AlloyDB inline filtering"
description: "Experimenting with Scalable Nearest Neighbour (ScaNN) index for hybrid query on embedding vector with metadata columns"
pubDate: "Aug 7 2025"
---

## Background

Filtering on structured metadata as well as embedding vectors effciently has historically been a scaling challenge for applications involving RAG. AlloyDB released a new feature called [inline filtering](https://cloud.google.com/blog/products/databases/enhancing-alloydb-vector-search-with-inline-filtering-and-enterprise-observability) to achieve exactly that. This gist contains some of my learnings while experimenting with inline filtering using ScaNN index to achieve efficent and scalable hybrid search.

## Summary (TLDR)

- The recommended query utilizes a 2-stage hybrid search process, where first stage performs a search on embedding chunks using inline filtering with ScaNN index, and the second stage refines the result by selecting the highest score chunk for each document.

- The query scales in the majority of the hybrid search scenarios with O(√n + k log k) where k << n.

- In order to utilize inline filtering for hybrid search, it is necessary to denormalize the filtering metadata columns and have them available on the same data table as the embedding vectors.

- Hybrid search is not guaranteed to always utilize inline filtering. The query planner may decide to perform pre-filtering of the metadata instead depending on the estimated selectivity of the metadata filters.

- Non-filtering columns do not need to be denormalized, this may result in a slightly more complex query than what is recommended here in actual implementation.

## Index creation

Assuming you have a table called `denormalized_embedding`, in which the embedding vectors are stored in a column named `embedding_vector`:

```SQL
SET maintenance_work_mem = '300MB';
CREATE INDEX idx_embedding_denormalized_scann
ON denormalized_embedding
USING scann (embedding_vector l2)
WITH (num_leaves=1000, max_num_levels = 1);
ALTER DATABASE postgres SET ScaNN.enable_inline_filtering = ON;
ANALYZE denormalized_embedding;
```

The `l2` argument supports postgres `<->` operator, use `cosine` to support `<=>` operator.
Refer to GCP [documentation](https://cloud.google.com/alloydb/omni/current/docs/reference/scann-index-reference) regarding tuning parameters.

## Hybrid search query

```SQL
WITH vector_candidates AS (
   -- Stage 1: Use ScaNN index with inline filtering for optimal performance
   SELECT
       chunk_id,
       file_id,
       authors,
       file_type,
       publication_date,
       category,
       embedding_vector <=> '[prompt vector]'::vector AS similarity_score
   FROM denormalized_embedding
   WHERE
	-- metadata filters
authors @> ARRAY ['Author Name A']
file_type = ANY(ARRAY ['pdf', 'doc'])
AND category = ANY(ARRAY ['category 1'])
AND publication_date >= '2022-01-01 00:00:00'
AND publication_date <= '2023-12-31 23:59:59'
   ORDER BY similarity_score
),


best_per_source AS (
   -- Stage 2: Deduplicate by chunk_id, keeping best similarity score
   SELECT DISTINCT ON (file_id)
       chunk_id,
       file_id,
       authors,
       file_type,
       publication_date,
       category,
       similarity_score
   FROM vector_candidates
   ORDER BY file_id, similarity_score ASC
)


-- Final result with proper column aliases
SELECT
   chunk_id,
   file_id,
   authors,
   file_type,
   publication_date,
   category,
   similarity_score
FROM best_per_source
ORDER BY similarity_score ASC
LIMIT 1000; -- if required, use LIMIT with OFFSET for page-based pagination
```

In the first stage of the query, filtering on the embedding chunks table, all required metadata columns and embedding vector distance, selecting its result as a CTE.
In the second stage, selecting from previous CTE, and deduplicating the chunks based on document (file_id), creating another CTE.
Finally, we can join additional tables on previous CTE if required to bring in non-filtering data, as well as returning a truncated dataset with pre-determined limit and offset.

## Time complexity

The stage 1 part of the query has a time complexity of O(√n), where inline filtering is applied to the denormalized table.

The CTE(Common Table Expression) from stage 1 of the query is then used in the next part to de-duplicate the embedding chunks by file_id, effectively selecting only the best chunk for each source document and ordering the results. This part of the query has a time complexity of O(k log k), where k is the number of results selected from stage 1.

Therefore the overall time complexity of this query is O(√n + k log k), and k is likely very small and may be negligible compared to n.

## Metadata denormalization

Denormalizing matadata to be filtered on is necessary for efficient inline filtering to utilize ScaNN index.

The query below is written to filter on metadata columns through table joins:

```SQL
SELECT
   authors,
   file_type,
   publication_date,
   category,
   embedding_vector <-> '[prompt vector]'::vector AS similarity_score
FROM
   embedding
JOIN metadata ON metadata.file_id = file_id
WHERE metadata.publication_date <= '2025-12-31'
ORDER BY
   similarity_score
LIMIT 1000;
```

This query would appear to filter on the metadata columns first before ordering by vector distance on the embedding before truncating the final results. This query would also return quickly depending on the LIMIT size. However, examineing the query plan reveals that the embedding vectors were filtered on first and truncated by the limit, before metadata filters are applied, thus why the query may appear fast, at the risk of returning significant fewer than desired number of records, and an unpredictable number of records at that.

If we attempt to re-write this query using CTE on the metadata filtering:

```SQL
WITH filtered_embeddings AS (
    SELECT
        chunk_id,
        file_id,
        embedding_vector,
        authors,
        file_type,
        publication_date,
        category
    FROM embedding
    JOIN metadata ON metadata.file_id = file_id
    WHERE metadata.publication_date <= '2025-12-31'
)
-- Then perform vector similarity search on filtered results
SELECT
    fe.chunk_id,
    fe.authors,
    fe.file_type,
    fe.publication_date,
    fe.category,
    fe.embedding_vector <=> '[prompt vector]'::vector AS similarity_score
FROM filtered_embeddings fe
ORDER BY similarity_score
LIMIT 1000;
```

The query planner is "smart" ebough to decide to filter on the embedding vector and truncate the result first before applying metadata filters, which again is not the desired query behavior.

If we force the query planer to filter on joined metadata column first before vector distance by structuring the metadata filtering part as a subquery, such as the following:

```SQL
SELECT
   chunk_id,
   authors,
   file_type,
   publication_date,
   category,
   similarity_score
FROM (
   SELECT
       fe.chunk_id,
       fe.authors,
       fe.file_type,
       fe.publication_date,
       fe.category,
       fe.embedding_vector <-> '[prompt vector]'::vector AS similarity_score
   FROM (
       -- Materialize filtered embeddings first
       SELECT DISTINCT
           chunk_id,
           file_id,
           embedding_vector,
           metadata.authors,
           metadata.file_type,
           metadata.publication_date,
           metadata.category
       FROM embedding
       JOIN metadata ON metadata.file_id = file_id
       WHERE metadata.publication_date <= '2025-12-31'
   ) fe
) filtered_results
ORDER BY similarity_score
LIMIT 1000;
```

This query will indeed filter on metadata first, but it will be extremely slow computing the vector distance via sequential scan, as it could not utilize ScaNN index for this purpose.

Through experimentation and examining the query plans, it appears that the only way to filter by structured columns while ordering by vector distance, in a single step utilizing ScaNN index efficently, is to put the embedding vector column and the filtering columns on the same table, aka denormalizing the filtering columns.

## Selectivity of metadata filters affects the query plan

Typically for a given the following simple hybrid query on a denormalized embedding table:

```SQL
SELECT
   authors,
   file_type,
   publication_date,
   category,
   embedding_vector <-> '[prompt vector]'::vector AS similarity_score
FROM
   denormalized_embedding
WHERE
-- authors @> ARRAY[real author names]
-- authors && ARRAY[real author names]
   publication_date <= '2025-12-31'
ORDER BY
   similarity_score
LIMIT 1000;
```

It has the following query plan:

```
Limit  (cost=352.37..393.96 rows=1000 width=65) (actual time=3.926..119.434 rows=1000 loops=1)
  Buffers: shared hit=8438 read=791
  I/O Timings: shared read=104.822
  ->  Index Scan using idx_embedding_denormalized_scann on denormalized_embedding  (cost=352.37..41838.69 rows=1000000 width=65) (actual time=3.923..119.319 rows=1000 loops=1)
  "Order By: (embedding_vector <-> '[prompt vector omitted]'::vector)"
        Filter: (publication_date <= '2025-12-31 00:00:00'::timestamp without time zone)
        Buffers: shared hit=8438 read=791
        I/O Timings: shared read=104.822
```

which indicates efficient execution of bothing embedding vector distance and metadata filtering using ScaNN index.

However, depending on what you are filtering and the data that is there, you may get a very different query plan. From previous example, we change the metadata filters to filter on authors column using the postgres `@>` (array contain) operator, we may receive the following query plan instead:

```
Limit  (cost=48.03..48.03 rows=1 width=65) (actual time=0.186..0.187 rows=0 loops=1)
  Buffers: shared hit=20
  ->  Sort  (cost=48.03..48.03 rows=1 width=65) (actual time=0.184..0.185 rows=0 loops=1)
		"Sort Key: ((embedding_vector <=> '[prompt vector omitted]'::vector))"
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=20
        ->  Bitmap Heap Scan on idx_embedding_denormalized_scann denormalized_embedding  (cost=44.00..48.02 rows=1 width=65) (actual time=0.181..0.181 rows=0 loops=1)
			  "Recheck Cond: (authors @> '{""Author A Omitted"",""Author B Omitted"",""Author C Omitted"",""Author D Omitted""}'::text[])"
              Buffers: shared hit=20
              ->  Bitmap Index Scan on idx_embedding_denormalized_authors  (cost=0.00..44.00 rows=1 width=0) (actual time=0.174..0.174 rows=0 loops=1)
					"Index Cond: (authors @> '{""Author A Omitted"",""Author B Omitted"",""Author C Omitted"",""Author D Omitted""}'::text[])"
                    Buffers: shared hit=20

```

This query no longer uses ScaNN index when authors field filtering is involved. It instead pre-filters on the authors field first before calculating the distance of each of the pre-filtered rows.

Next, we change the authors filter to use postgres `&&` (array overlap) operator, we may receive the following query plan:

```
Limit  (cost=654.87..3465.84 rows=1000 width=65) (actual time=6.274..112.612 rows=221 loops=1)
  Buffers: shared hit=78954
  ->  Index Scan using idx_embedding_denormalized_scann on denormalized_embedding  (cost=654.87..39682.35 rows=13884 width=65) (actual time=6.272..112.572 rows=221 loops=1)
		"Order By: (embedding_vector <=> '[prompt vector omitted]'::vector)"
		"Filter: (authors && '{""Author A Omitted"",""Author B Omitted"",""Author C Omitted"",""Author D Omitted""}'::text[])"
        Rows Removed by Filter: 15270
        Buffers: shared hit=78954
```

Which indicates the query is now using inline filtering again to filter on authors column and embedding vector distance in the same step while utilizing ScaNN index efficiently.

At this point, it may be tempting to conclude that AlloyDB inline filtering works with array overlap operator (`&&`), but not array contains operator (`@>`). However, depending on the selectivity of the filter applied, such as if the specificity of the authors filter is reduced, you may also encounter the following query plan instead:

```
Limit  (cost=9498.78..9501.28 rows=1000 width=65) (actual time=90.181..90.425 rows=1000 loops=1)
  Buffers: shared hit=12685 read=335
  I/O Timings: shared read=54.118
  ->  Sort  (cost=9498.78..9505.18 rows=2561 width=65) (actual time=90.179..90.289 rows=1000 loops=1)
		"Sort Key: ((embedding_vector <=> '[prompt vector omitted]'::vector))"
        Sort Method: top-N heapsort  Memory: 289kB
        Buffers: shared hit=12685 read=335
        I/O Timings: shared read=54.118
        ->  Bitmap Heap Scan on embedding  (cost=43.85..9358.36 rows=2561 width=65) (actual time=2.549..87.421 rows=2753 loops=1)
			 "Recheck Cond: (authors && '{""Author A Omitted"",""Author B Omitted""}'::text[])"
              Heap Blocks: exact=1966
              Buffers: shared hit=12685 read=335
              I/O Timings: shared read=54.118
              ->  Bitmap Index Scan on idx_embedding_authors  (cost=0.00..43.21 rows=2561 width=0) (actual time=1.157..1.157 rows=2753 loops=1)
				   "Index Cond: (authors && '{""Author A Omitted"",""Author B Omitted""}'::text[])"
                    Buffers: shared hit=6

```

This query is written exactly the same as the previous one, except it’s filtering for overlapping with any of the 2 instead 4 authors from the database, which increased the selectivity of the authors filter; and the query planner decided to execute pre-filter using the authors filter, before calculating the vector distances of the pre-filtered rows.

Postgres query planner uses [table statistics](https://www.postgresql.org/docs/current/planner-stats.html) to estimate the selectivity of a given query filter, therefore the values used in the query (i.e. specific author names) would affect this behavior.
