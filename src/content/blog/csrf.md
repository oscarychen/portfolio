---
title: "Web security: Cross site request forgery (CSRF)"
description: ""
pubDate: "Dec 9 2021"
---

## Session Hijacking

Cookie sent over unencrypted HTTP connection

#### Mitigation

Use `Secure` attribute on [cookie](/blog/cookies_same_origin_policy/) to prevent it from being sent over unencrypted connection: `Set-Cookie: key=value; Secure`

Use `HttpOnly` attribute to prevent access by JavaScript: `Set-Cookie: key=value; Secure; HttpOnly`

Do not rely on `Path` attribute for security, it can be bypassed using `<iframe>` with the path of the cookie: `iframe.contentDocument.cookie`. This is allowed by [Same Origin Policy](/blog/cookies_same_origin_policy/).

## CSRF

Because of ambient authority, cookies are included to request to domains (even from unrelated website), it may force users to execute unwanted actions. It is effective even when the attacker can't read the HTTP response.

`Referer` header does not mitigate CSRF because of caching. Sites can opt out of sending the `Referer` header, some browser extensions might omit it for privacy reasons. It is good practice to:

- Add a [Vary: Referer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary) header
- or, add a [Cache-Control: no-store](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) header

#### Mitigation

Client side: set cookie attribute `SameSite` to `Lax` or `Strict`.
Server side: use CSRF token on requests that rely on ambient authority (cookie-based authorization).

#### CSRF Token

- Randomly generated string as CSRF token
- Hashing of session id and a CSRF secret to create CSRF token

## Case Study: Github third-party authentication CSRF vulnerability

![](/images/blog/csrf_flow.png)

This flow is valid, however in the implementation of the end points:

- Github server did not check that this is a POST request and not HEAD request.
- Github used the same URL for bring up authorization page and form submission.

The following outlines the coding for this Github authorization endpoint:
![](/images/blog/csrf_github_code.png)

The vulnerability was that if an attacker sends a HEAD request instead POST, the request gets treated as GET and it does not trigger the web framework’s CSRF token checking mechanism. (Most web frameworks treats HEAD requests as GET and do not perform CSRF check on those).

![](/images/blog/csrf_github_vulnerability.png)

To fix this vulnerability:

- Use SameSite cookies in addition to CSRF token
- Implement separate controller for GET/HEAD requests vs POST request, as well as catch-all case for handling wrong request types
- Use separate URLs for authorization page and authorize endpoint

---

_Based on [Feross Aboukhadijeh](https://feross.org)'s lectures ([1](https://youtu.be/0-q69vAYSwo), [2](https://youtu.be/Ox15IMOvWfA)) on web security at Stanford University._
