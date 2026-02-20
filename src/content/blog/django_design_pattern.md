---
title: "Django design pattern"
description: "Building Django project like a Java developer: design pattern for complex web projects"
pubDate: "Feb 13 2025"
---

## Background

Django and Django REST Framework are designed around Active Records design pattern where each Record Object represents a “living” database record that can be interacted with where the changes as resulted of the interaction is reflected on the underlying database record automatically.
This has allowed many of Django's libraries including Django REST Framework to access data and modify data from all parts of the application, and thus encourages vertically integrated features where behaviors that are defined by Models, such as using ModelSerializer and ModelViewset.

## Challenges

This design pattern presents several areas of concerns:

- **Tight coupling**: mixes data access and business logic, violates Single Responsibility, makes unit test difficult. DRF Serializer is one such example that does much more than what the name suggests, it not only serializes data but also performs CRUD operation on models.
- **Performance limitation**: heavy object creation and retrieval for simple database operations, often as the result of query abstraction through the use of Serializers, which also makes query optimization more opaque
- **Scalability challenge**: difficult to manage in large and complex applications, often as the result of “fat” model classes. Hidden logic through use of Signal often lead to bugs that are not obvious and increases cognitive load for developers.

## Goal

Implement data models, business logic, and APIs separate from each other:

          ----------------------------------
           Client Tier / Presentation Layer
          ----------------------------------
            ↓                             ↑
        HTTP Requests                  Responses
            ↓                             ↑
       -----------------------------------------
        Application Tier / Business Logic Layer
       -----------------------------------------
              ↓                          ↑
       Data Operations             Query Results
              ↓                          ↓
           --------------------------------
            Data Tier / Persistence Layer
           --------------------------------

We would like a project with 3 tiers: Models(Persistence Layer), Services (Application Layer), and APIs (Presentation Layer):

```
/django-project
|-/config
  |- settings.py
|-/django_apps     (Persistence Layer)
  |-/app_a/
    |- models.py
    |- app.py
|-/app_services    (Application Layer)
|-/api             (Presentation Layer)
|-/admin_commands
  |- app.py
  |-/management/
    |-/commands/
|-/utility
```

### Django Project-level Configuration (config)

Contains project configuration, top-level url routing, web server entry point

### Persistence Layer (django_apps)

Traditionally this is the heart of an Django apps representing domains.

#### Responsibilities

- Data models
- Data table (model) constraints Migrations.

#### Avoid

- Domain logic
- Cross model helper function (including management commands)
- APIs (Django Views)
- URL routing

### Application Layer (app_services)

Encapsulates complex business and domain logic relying on one or more models, expose them as functions and/or classes to be used elsewhere within the application

#### Responsibilities

- Helper classes and functions for CRUD operations on models
- Validates CRUD operations
- Provides granular control on complex permissions
- Provides internal APIs to be called on programmatically within the application

#### Avoid

- Avoid usage of DRF Serializers and Model Serializers to validate input data
- Avoid using DRF Serializers and Model Serializers to perform CRUD on models

### Presentation Layer (api)

Exposed app_services as Django “Views” aka APIs, responsible for handling requests and returning a response.

### Responsibility

- Implements authentication control and sometimes simple permissions control that do not rely on specific model data
- Validates request data, santizes input, such as with help of DRF Serializer or Pydantic Schema
- Depend on app_services to perform operations
- Render a response, including catching exceptions bubbled up from app_services if necessary and render an appropriate response accordingly
- URL routing

### Avoid

- Should not directly interact with models
- Should use use DRF Model Serializer to perform CRUD operation on models
- Avoid nested URL routing, keep all routes in one file (a single urls.py)

### Django Management Commands (admin_commands)

Instead of keeping these within individual Django app modules, create a top-level Python module in the root of the repository, and register it as a Django app as you normally would and provide the path to it in the Django settings.py.

## REST API Conventions

One of the drawback of separating every API implementation in Django REST Framework is that we are unable to comply with some of the REST API conventions:

```
GET   /items/       # List all items
POST  /items/       # Create a new item
GET   /items/:id/   # Retrieve an item
PUT   /items/:id/   # Update an item
DELET /items/:id/   # Delete an item
```

This is the typical URI and their HTTP method type design we would expect. However, as Django routes request based on the path only and not the method type, **List** and **Create** actions have to be on the same route, while the **Retrieve**, **Update**, and **Delete** actions have to be on the same route. (This is also why Django REST Framework provides generic view classes such as `ListCreateAPIView` and `RetrieveUpdateDestroyAPIView`).

In order to completely separate the API implementation between each action, we are force to implement a bit different convention to include the action as part of the URI:

```
GET   /items/list/          # List all items
POST  /items/create/        # Create a new item
GET   /items/:id/retrieve/  # Retrieve an item
PUT   /items/:id/update/    # Update an item
DELET /items/:id/delete/    # Delete an item
```

or some variation of the above convention.

If you are using one of the alternative framework such as Django-ninja, this is not an issue, as the ninja.Router can route requests based on URI path as well as method types.

## Example: Avoid implementing buiness logic in Models

```python
# django_project/django_apps/account/models.py

class Account(Model):
  ...
  def save(self):
    if self.id is None:
      AccountHistory.objects.create(...)
      ExternalAPI.do_something(...)

class AccountHistory(Model):
  account = ForeignKey(Account, ...)
  ...

```

#### Why is this bad?

This effectively makes the Account model dependent on the AccountHistory model. But the database relational dependency already has the AccountHistory model dependent on the Account model. If we were to separate the models further into different modules, this would create circular dependency.
Whenever an Account record is being created, it needs to wait for a network request to be made to the database to create an AccountHistory model as well as another network request to external API before this function can return. What we can’t tell from this pattern of design is whether the AccountHistory model also dependent on something else in a similar manner, thus increases the development cognitive load.

```python
# django_project/django_apps/account/models.py

class Account(Model):
  ...
class AccountHistory(Model):
  account = ForeignKey(Account, ...)
  ...

# django_project/django_apps/account/signals.py

@receiver(*post_save, sender=Account)
def account_post_save(sender, instance, created, *args, **kwargs):
  if created:
    ExternalAPI.do_something(...)
    AccountHisory.objects.create(...)
```

#### Why is this also bad?

Django Signals are synchronous, if the Signal is incurring additional network request (such as updating database), this blocks the caller of the Signal. In the example above, the Account.save() would not return until the Signal also returns.
Django Signal also does not handle exceptions, they simply throw it up the stack. In the example above, unless there is error handling in the Account.save() to anticipate various exceptions that might be thrown by the Signal, we may end up with the Account instance being created by the Account.save() but missing the corresponding AccountTransition instance being created.
Use of Signal also increases the development cognitive complexity.

#### What do to instead?

```python
# django_project/app_services/account_service.py

from django.db import transaction

class AccountService:
  def create_account(self, ...):
    with transaction.atomic():
      account = Account.objects.create(...)
      ExternalAPI.do_something(...)
      AccountHistory.objects.create(account=account, ...)
    return account
```

## Example: Views/Viewsets coupling API implementations

```python
# django_project/api/account/account_views.py

class AccountViewSet(Viewset):
  def get_queryset(self):
    if self.request.user.is_admin:
      ...
    elif self.request.user.account:
      return Account.objects.filter(id=self.request.user.account.id)
    ...

  def get_object(self):
    ...

  def get_serializer_class(self):
    if self.action in ("partial_update", "update"):
      ...
    elif ...:
      ...
    else:
      ...

  def create(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    ...
    return Response(serializer.data, 200)

  def update
    ...
```

#### Why is this bad?

APIs that have different data fetching, data serialization, and sometimes permission controls are coupled together into a so-called Viewset class. As such, methods such as .get_object, .get_queryset, and .get_serializer_class are often overwritten to provide switch cases for different APIs. This makes APIs difficult to change and maintain.

The use of serializer to perform create and update operation also makes complex update and create operations that impact relations and depending on context difficult to implement and maintain; and often requires bits and pieces of inherited methods of Serializer class being written in different places which result in code with **unclear intention**.

### What to do instead?

Separate API implementations. Avoid implementing heavy business logic in API, make use of Application Layer’s service classes for business logic.

```python
# django_project/app_services/account_service.py

from django.db import transaction

class AccountService:
  def create_account(self, user: User, data: AccountData):
    self.can_user_create_account(user, data):
    self.is_account_data_valid(data):

    with transaction.atomic():
      account = Account.objects.create(...)
      AccountHistory.objects.create(account=account, ...)
    return account

  def can_user_create_account(self, user: User, data: AccountData):
    ...
    raise PermissionDenied(...)

  def is_account_data_valid(self, data: AccountData):
    ...
    raise PermissionDenied(...)
```

```python
# django_project/api/account/account_create_api.py

from rest_framework.views import APIView

class AccountCreateAPI(APIView):
  def post(self, request):
    serializer = AccountCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    service = AccountService()
    account = service.create(serializer.validated_data)
    response_data = AccountCreateReturnDataSerializer(account)
    return Response(response_data, 200)
```

A note on **permission control**: In most cases, you won't find any real advantage of implementing permission checks in the Service class over implementing them as custom Permission classes in Django REST Framework. However, there are two considerations:

- Permission controls implemented in the Service are closer to the business logic they are protecting as opposed to in a separate permissions.py. This makes permission controls that are highly granular and specific to the business logic easier to find and maintain.
- Permission controls implemented in the Service is more portable and has no dependency on a API framework such as Django REST Framework. For example, if you are ever considering swapping out Django REST Framework for Django Ninja, it's one less thing to worry about. Afterall, why should business logic have dependency on a library for API?

## Example: Ambiguous functions provided by services

```python
# django_project/app_services/foo_service.py

class FooService:
  def create_foo(self, data):  # Don't do this
      account = data["account"]
      user = data["user"]
      some_optional_field = data.get("some_optional_field")
      ...
```

#### Why is this bad?

The argument data is ambiguous and makes this service function difficult to use without looking at its implementation details.

#### What to do instead?

Instead, move variables from data into function signature, to indicate to the caller what arguments can be used. This helps the API implementer use the Service without diving into the implementation detail of the Service.

```python
# django_project/app_services/foo_service.py
from typing import Optional

class FooService:
  def create_foo(self, account: Account, user: User, some_optional_field: Optional[str] = None):
      account = data["account"]
      user = data["user"]
      some_optional_field = data.get("some_optional_field")
      ...
```

Alternatively, you can provide typing to the previous data argument to make it more obvious what it should have:

```python
# django_project/app_services/foo_service.py

from typing import TypedDict, NotRequired, Optional

class FooCreateData(TypdDict):
  account: Account
  user: User
  some_optional_field: NotRequired[str]
  some_required_but_nullable_field: Optional[str]

class FooService:
  def create_foo(self, data: FooCreateData):
      account = data["account"]
      user = data["user"]
      some_optional_field = data.get("some_optional_field")
      ...
```

## Example: unit testing dependencies

Imagine having a service and api implementation as the following:

```python
# django_project/app_services/foo_service.py

class FooService:

  def _parse_external_api_response(self, response):
    ...

  async def _register_foo_with_external_api(self):
    async with httpx.AsyncClient() as client:
      response = await client.post("https://...", data, headers)
      return self._parse_external_api_response(response)

  async def create_foo(self):
    data = self._register_foo_with_external_api()
    foo = Foo.objects.create(data)
    return foo

```

This is an example of a service that handles making a request to some external API while creating some database record. Meanwhile the following API depends on this service:

```python
# django_project/api/foo_apis/foo_create_api.py

class FooCreateAPI(APIView):
  def post(self):
    service = FooService()
    foo = asyncio.run(service.create_foo())
    return Response({"id": foo.id}, status=HTTP_201_CREATED)
```

You may be tempted to write a unit test for the API as such:

```python

def test_foo_create_api_happy_path_returns_201(self):
  client = APIClient()
  with patch("django_project.app_services.foo_service.FooService._register_foo_with_external_api", return_value="abc"):
    response = client.post("/api/foo/create/")
    assert response.status_code == 201
```

#### Why is this bad?

This unit test will be somewhat difficult to maintain, as it seems to require the maintainer of the API to also have in-depth knowledge of how the Service is implemented. Note that in order to set up the test, we had to know what inner methods of the Service to patch.

Python 3.9 introduced a new typing class called Protocol. It is in fact an implicit type of interface (just like the interface in Golang) that could be very useful for facilitating dependencies between modules. In an ideal scenario, if we have to indicate to the APIView class what Service dependency it should have, and declare a Protocol that such a Service class need to comply to, then we can swap such Service implementation with a mock one during unit test.

However, in Django, the views are more or less instantiated for us typically when declaring the url path in urls.py, we instead use monkeypatching to achieve the same behavior during unit test.

#### What to do instead?

To make this unit test more maintainable, it should patch the behavior of the **externally exposed methods** of that Service that are used by the API.

```python
def test_foo_create_api_happy_path_returns_201(self):
  client = APIClient()
  with patch("django_project.app_services.foo_service.FooService.create_foo", return_value=fake_foo):
    response = client.post("/api/foo/create/")
    assert response.status_code == 201
```

This way the burden of what the Service is doing is minimized when a developer is working on the API. The Service's itself should have unit tests implemented to test its own internal behaviors, and not rely on test coverage from that of an API.
