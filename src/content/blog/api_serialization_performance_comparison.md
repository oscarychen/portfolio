---
title: "API Serialization Performance Comparison"
description: "Comparing API performance in Django REST Framework, Django Ninja, FastAPI, and Golang."
pubDate: "Nov 23 2024"
---

Recently I was curious about the single thread performance in some of the API frameworks, out of the need to make Django REST Framework run leaner and faster. I ended up scaffolding a Django Ninja project, a Fast API project, and a Golang project for comparison.
[This repo](https://github.com/oscarychen/building-efficient-api) is a series of tests of the API framework performance in terms of their ability to serialize large amount of data, including each of the project setup.

One thing that was surprising to me is that Django-ninja does not appear to be using more memory than the Go implementation.
