---
title: "Postgres ltree"
description: "Postgres extension for querying tree data efficiently"
pubDate: "Mar 10 2023"
---

This is based on [previous post](/blog/django_hierarchical_tree_data/) about use of materialized path in sql database, using postgres's official ltree extension to achieve even more efficient and full set of materialized path features.

```sql
CREATE EXTENSION ltree;

CREATE TABLE test (path ltree);


--                         Top
--                      /   |  \
--              Science Hobbies Collections
--                  /       |              \
--         Astronomy   Amateurs_Astronomy Pictures
--            /  \                            |
-- Astrophysics  Cosmology                Astronomy
--                                         /  |    \
--                                  Galaxies Stars Astronauts


CREATE INDEX path_gist_idx ON test USING GIST (path);
CREATE INDEX path_idx ON test USING BTREE (path);


-- get root (top-level ancestor) of a node --
SELECT path FROM test WHERE path = SUBPATH('Top.Science.Astronomy', 0, 1);

-- get all ancestors of a node --
SELECT path FROM test WHERE path @> 'Top.Science.Astronomy.Astrophysics';

-- get all descendants of a node(including self) / subtree of a node --
SELECT path FROM test WHERE path <@ 'Top.Science';

-- get immediate children (next 1 level) nodes of a node --
SELECT path from test WHERE path ~ 'Top.*{1}';

-- get sibling nodes of a node (this may be easier selecting the parent path from application layer and run query above) --
SELECT path from test WHERE path ~ (ARRAY_TO_STRING((STRING_TO_ARRAY('Top.Science.Astronomy.Stars', '.'))[:ARRAY_LENGTH(STRING_TO_ARRAY('Top.Science.Astronomy.Stars', '.'), 1) -1], '.') || '.*{1}')::LQUERY;

-- delete subtree (cut off a branch) / delete a node and all of its descendants --
DELETE from test where path <@ 'Top.Science.Astronomy';

-- replant a branch (move a node and all of its descendants to root level) --
UPDATE test set path = SUBPATH(path, NLEVEL('Top.Hobbies')-1) WHERE PATH <@ 'Top.Hobbies';

-- move a branch to another part of the tree (ie: after inserting a node into middle of tree) --
UPDATE test SET path = 'Top.Science' || SUBPATH(path, NLEVEL('Top.Collections.Pictures.Astronomy')-1) WHERE PATH<@ 'Top.Collections.Pictures.Astronomy';

-- building dynamic string for querying: depending on the operator used, the string query needs to be casted to either LTREE or LQUERY --
SELECT path FROM test WHERE path <@ ('Top' || '.' || 'Science')::LTREE;
SELECT path from test WHERE path ~ ('Top' || '.*')::LQUERY;


-- Goodbye --
TRUNCATE test;
```
