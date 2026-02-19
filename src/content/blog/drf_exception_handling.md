---
title: "Exception handling in Django REST Framework"
description: "Centralized exception handling in a very opinionated framework"
pubDate: "Apr 16 2022"
---

In Django REST Framework views (this includes anything that might be called from a view), anytime when an exception occurs it will get handled by the framework.

- If the Exception is DRF [APIException](https://www.django-rest-framework.org/api-guide/exceptions/#apiexception), or Django [PermissionDenied](https://docs.djangoproject.com/en/4.0/ref/exceptions/#permissiondenied), the View will return the appropriate HTTP response with a HTTP status code and detail about the error.
- If the Exception is other types of Django or Python Exceptions, HTTP 500 response will be returned.

To provide more customized error response with the appropriate status code, you will want to raise a subclass of APIException:

```python
from rest_framework.exceptions import ValidationError

raise ValidationError(detail={"some_field_name": "Invalid input."})
```

And this would result in the appropriate HTTP response from the API.

However if the Exception is one of many other Python and Django Exception types, the View will return a HTTP 500 Status, example:

```python
from rest_framework.serializers import ModelSerializer
class MySerializer(ModelSerializer):
  def create(self, validated_data):
    Model.objects.create(id=-1)
  ...
```

This Serializer when used inside a DRF View, will likely raise a `django.db.utils.IntegrityError`, which will result in the View returning a HTTP 500 response.

We could do something like:

```python
from rest_framework.serializers import ModelSerializer
class MySerializer(ModelSerializer):
  def create(self, validated_data):
    try:
      Model.objects.create(id=-1)
    except:
      raise APIException(...)
  ...
```

But this means that you would have to do this `try...except` pattern everywhere you may encounter an `IntegrityError` inside the View.

A better approach is to provide a global custom error handling function to DRF that can generate appropriate HTTP responses for various errors:

```python
# my_project.error_handling.py
from rest_framework.views import exception_handler
from django.db.utils import IntegrityError
from rest_framework.response import Response
from rest_framework import status

def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response:
        return response
    elif isinstance(exc, IntegrityError):
        data = {'detail': str(exc)}
        return Response(data, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
```

and then, inside the project's Django `settings.py`, include the following setting:

```python
# settings.py
REST_FRAMEWORK = {
  ...
  'EXCEPTION_HANDLER': 'my_project.error_handling.api_exception_handler'
}
```

Instead of a generic HTTP 500 server error, the views will now respond gracefully with HTTP 422 status and the appropriate message wherever an IntegrityError is encountered,
and no more `try...except`.
