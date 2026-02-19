---
title: "Django custom lookups"
description: "Custom re-usable query look up for Django ORM"
pubDate: "Dec 4 2021"
---

_This article is based on my [Stackoverflow answer](https://stackoverflow.com/a/68156520/10856743) - Django query lookup 'startswith' on table fields._

Let's say you have a table of partial postal codes:

```
| codes  |
----------
| A1A    |
| A1A0   |
| A1B    |
| ...    |
```

Now, if you want to find codes in this table column that starts with `A1`, it's very easy to do with Django's field lookups such as [startswith](https://docs.djangoproject.com/en/dev/ref/models/querysets/#startswith) or [istartswith](https://docs.djangoproject.com/en/dev/ref/models/querysets/#istartswith):

```python
PostalCodes.objects.filter(codes__startswith="A1")
```

and you would have gotten codes that starts with "A1".

Now, what if you were given a postal code such as "A1A0C0", and you want to find any codes from the table column that matches the given code? In other words, any codes that starts from the begining of the string and is also a substring of "A1A0C0"?

The raw Postgres SQL query that would have achieved this would be:

```
SELECT * from PostalCode WHERE 'A1A0C0' LIKE codes||'%'
```

This should give you codes `A1A` and `A1A0`.

When using Postgres' [LIKE](https://www.postgresql.org/docs/8.3/functions-matching.html) for pattern matching, `%` is a wild character that matches one or more characters , and `||` is used to concatenates strings.

Now, to properly implement this in Django, you should write a [Custom Lookup](https://docs.djangoproject.com/en/dev/howto/custom-lookups/#how-to-write-custom-lookups):

```python
from django.db.models.fields import Field
from django.db.models import Lookup

@Field.register_lookup
class LowerStartswithContainedBy(Lookup):
    '''Postgres LIKE query statement'''
    lookup_name = 'istartswithcontainedby'

    def as_sql(self, compiler, connection):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        return f"LOWER({rhs}) LIKE LOWER({lhs}) || '%%'", params
```

Note that in the Django Custom Lookup implementation, we have `'%%'` instead of a single `'%'`. This is needed as Django uses Postgres [format](https://www.postgresql.org/docs/current/functions-string.html#FUNCTIONS-STRING-FORMAT) function on the string, and need to escape the `%` character. We also used the LOWER function to make this lookup case insensitive.

You can put this piece of code anywhere in your project, as long as the file is imported so that the Field.register_lookup docrator function is ran.

Now, to make the aforementioned query but now using a Django query:

```python
PostalCodes.objects.filter(codes__istartswithcontainedby="A1A0C0")
```

and you will again get codes `A1A` and `A1A0`.
