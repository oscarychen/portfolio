---
title: "Working with tree data structure efficiently in PostgresSQL and Django"
description: "Materialized path for navigating tree data structure in relational database"
pubDate: "Dec 6 2021"
---

There are two typical models for dealing with tree data structure in SQL databases: [adjacency list model and nested set model](https://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/). There are several packages for Django that implements these models such as [django-mptt](https://github.com/django-mptt/django-mptt), [django-tree-queries](https://github.com/matthiask/django-tree-queries), and [django-treebeard](https://github.com/django-treebeard/django-treebeard).

In this article, I want to explain a different approach I took in a project for storing hierachichal data, as well as search and retrieval of sub-trees. This approach is similar in principle to [materialzed path](https://bojanz.wordpress.com/2014/04/25/storing-hierarchical-data-materialized-path/), which django-treebeard package also provides an implementation. This article will show you how I achieved this without any of the specific packages, and using only a couple of Django custom lookups.

## The data

I was given a dataset on [disease classifications](https://en.wikipedia.org/wiki/ICD-10) that looks like the following.

```
| code        | description                    | level     |
------------------------------------------------------------
| Chapter 1   | Infectious diseases            | 1         |
| A00-A09     | Intestinal infectious disease  | 1_1       |
| A00         | Cholera                        | 1_1_1     |
| A000        | Classical cholera              | 1_1_1_1   |
| A001        | Cholera eltor                  | 1_1_1_2   |
| A15-A19     | Tuberculosis                   | 1_2       |
| A15         | Respitory tuberculosis         | 1_2_1     |
```

The data has a column called 'level' which indicates the hierachichal position in a tree.

## Django model

We will store this table as-is in SQL schema.

```python
from django.db import models
class DiseaseCode(models.Model):
    code = models.CharField(max_length=20)
    description = models.CharField(max_length=1000)
    level = models.CharField(max_length=100)

    class Meta:
        indexes = [
            models.Index(fields=['code']), # for searching by code
            models.Index(fields=['description]), # for searching by description
            models.Index(fields=['level']) # for retrieval of related nodes in a subtree
        ]
```

## Search and retrieval

When a user searches for `A000`, the desired output is a hierachichal result containing the sibling nodes of `A000` (nodes that share the same immediate parent with `A000`), and the ancestors of `A000` (nodes along the path from root node to `A000`).

To make this work, we will need to first search the `code` column for `A000`. And then using the `level` attribute of the retrieved `A000`, we will retrieve all of its siblings and ancestors.

Retieving the `A000` row is easy, in Django it's something like the following:

```python
codeObj = DiseaseCode.objects.get(code__iexact="A000")
```

And next we need to retrieve and sibling and ancestry nodes of the `codeObj`. We are going to write two [custom lookups](/blog/django_custom_lookup) for Django to achieve this.

### Ancestor nodes custom lookup

Ancestor nodes are the nodes where the `level` attribute is part of the `level` attribute of the node we are instered in. In our example of node `A000`, it has a `level` of `1_1_1_1`, therefore its ancestors would be any node with levels: [`1_1_1`, `1_1`, `1`].

In other words to find ancestor nodes, we are essentially just looking for a list of ancestor node levels that the node descended from.

Django already has a `in` lookup that looks at if something exists in a given list, we can find all of node `A000`'s ancestors by a query such as:

```python
DiseaseCode.objects.filter(level__in=['1_1_1','1_1','1'])
```

The problem is now to create this list.
I'm going to actually just inherit from the Django [in](https://docs.djangoproject.com/en/dev/ref/models/querysets/#in) lookup class:

```python
from django.db.models.fields import Field
from django.db.models.lookups import In
from itertools import accumulate

@Field.register_lookup
class AncestorLevelsOf(In):
    '''Find ancestors based on a level/path string in format of ie: 1_1_123_4'''
    lookup_name = 'ancestorsof'

    def get_prep_lookup(self):
        '''
        This function gets called before as_sql() and returns a value to be assigned as self.rhs.
        Split the rhs input string by "_", and returns list of all possible ancestor paths.
        '''
        levels = self.rhs.split("_")
        return list(accumulate(levels, func=lambda *i: "_".join(i)))
```

The `get_prep_lookup` method here just changes the query parameter from a level path such as '1_1_1_1', into a list of its potential ancestor paths, which is the aforementioned list: [`1_1_1`, `1_1`, `1`]. And then the rest of the lookup behavior will be exactly the same as the default [in](https://docs.djangoproject.com/en/dev/ref/models/querysets/#in) lookup that we inherited this from.

### Sibling nodes custom lookup

Now the other custom lookup we need is to find sibling nodes of the given node.
In the example of node `A000` having a level attribute of `1_1_1_1`, sibling nodes would be any nodes with a level attribute in the form of something like `1_1_1_\d+`.

The implementation of this custom lookup is the following:

```python
from django.db.models.fields import Field
from django.db.models import Lookup
@Field.register_lookup
class SiblingLevelsOf(Lookup):
    '''Find silbings based on a level/path string in format of ie: 1_1_123_4'''
    lookup_name = 'siblingsof'

    def get_prep_lookup(self):
        '''Change the rhs to parent level'''
        nodes = self.rhs.split("_")
        return "^" + "_".join(nodes[:-1]) + "\_[^\_]+$"

    def as_postgresql(self, compiler, connection):

        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        return f"{lhs} ~* {rhs}", params
```

In the `get_prep_lookup` function, we are splitting the `level` string being searched (ie: `1_1_1_1`), by the `_` character, removing the last number, and assemble it all together separated by the `_` character; and finally append `\_[^\_]+$`, which matches strings like "\_1", "\_2", or "\_123".

In the `as_postgresql` function, we assemble the SQL query together. For more information, refer to [Postgresql documentation](https://www.postgresql.org/docs/9.3/functions-matching.html).

## Putting it together

To retrieve all of ancestors, siblings, as well as immediate children of a given `level`:

```python
from django.db.models import Q

ancestors = Q(level__ancestorsof=level)
siblings = Q(level__siblingsof=level)
children = Q(level__istartswith=level)

objs = DiseaseCode.objects.filter(ancestors | siblings | children)
dicts = DiseaseCodeModelSerializer(objs, many=True).data
```

This should give you a list of dictionaries each representing a node. I used a [Django REST Framework model serializer](https://www.django-rest-framework.org/api-guide/serializers/#modelserializer) to turn the query set model instances into dictionaries.

The important thing to note here we have retrieved all relevant nodes using **a single query** that only hits the SQL database once.

## Final touch

You may want to organize the data into hierarchical representation before returning it in a response. I wrote a helper module to turn the a list of dictionaries into a nested dictionary representation with the help of the [anytree](https://anytree.readthedocs.io/en/2.8.0/) package.

```python
from collections import namedtuple
from anytree import Node
from anytree.exporter import DictExporter

EntryTuple = namedtuple('EntryTuple', ['obj', 'level'])

class TreeNodeWithUnderscoreSeparator(Node):
    '''Extending Anytree Node class with custom separator'''
    separator = "_"

def makeHierarchicalDictionary(dicts, nameAttribute="id", levelAttribute="level", treeNodeClass=TreeNodeWithUnderscoreSeparator):
    '''
    Given a set of dictionaries (which represent django instances),
    Returns a nested dictionary representation of the instances.
    This method make use of the Anytree library to populate the model instances into a tree structure,
    before exporting it into a deeply nested dictionary representation of all of the instances.
    '''

    nodeLevelTuples = [EntryTuple(obj=treeNodeClass(**d, name=d[nameAttribute]),
                                  level=d[levelAttribute]) for d in dicts]
    for node, level in nodeLevelTuples:
        node.parent = getParentObjFromCache(level, nodeLevelTuples)
    root = next(node for (node, _) in nodeLevelTuples if node.parent is None)
    return DictExporter().export(root)

def getParentObjFromCache(level: str, cachedEntries: List[EntryTuple]):
    '''
    Provided a level, a list of entries, returns the parent entry of the given level.
    Also checks for dangling branches (level strings without direct parent).
    '''
    parentLevel = _getParentOfLevel(level)
    if parentLevel is None:
        return None
    parentEntry = next(filter(lambda i: i.level == parentLevel, cachedEntries), None)

    if parentEntry:
        return parentEntry.obj
    elif parentLevel:
        return getParentObjFromCache(parentLevel, cachedEntries)

    if cachedEntries:
        if _getRootOfLevel(level) == _getRootOfLevel(cachedEntries[0].level):
            raise ValueError(f"Unable to find parent level of {level}.")

def _getParentOfLevel(level: str):
    '''Get parent level string of a given level string.'''
    pattern = "(.*)_\d+$"  # ie: _12
    match = re.search(pattern, level)

    if match:
        return match.group(1)
    else:
        return None

def _getRootOfLevel(level: str):
    '''Get root level of a given level string.'''
    pattern = "^(\d+[\*\d]*)(_\d+)*"
    match = re.search(pattern, level)
    if match:
        return match.group(1)
    else:
        raise ValueError(f"Unrecognized level string: {level}")
```

Back in your code, you can call the `makeHierarchicalDictionary` function and pass in the list of dictionaries:

```python
results = makeHierarchicalDictionary(dicts)
```

## Thoughts

This provides an approach to handling hierachical data alternative to adjacency model and nested set model. One thing I like about this approach is that it keeps the database table very simple and "readable". The implementation I provided above also keeps retrieval fairly efficient by primarily relying on on Postgresql's pattern matching functions, and it is implemented as Django custom lookups so that it is reusable.

In my specific project I only need to retrieve information from this table. If you need to create, update, and delete nodes from the tree, you may need to add more custom lookups to do it efficiently, especially if you care about the number ordering in the `level` attribute.
