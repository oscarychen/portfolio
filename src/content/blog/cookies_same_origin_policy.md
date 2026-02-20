---
title: "Web security: Cookies and Same origin policy"
description: "Examining how cookies and same origin policy are parts of different security models"
pubDate: "Dec 9 2021"
---

## Cookie vs Same Origin Policy

Cookies were created before Same Origin Policy and have different security models. Same Origin Policy relies on browser for enforcement, while ambiant authority based on cookies relies on server for enforcement.

Cookies are more restrictive in some aspects than Same Origin Policy while less restrict in others:

- Pages with the same hostname share cookies. Different origins can mess with each others cookies (between subdomains and domain).
- `Path` attribute partitions cookies, but it is ineffective as security measure becauase pages on same _origin_ can access each other's DOMs and run code on each other's contexts.
- But cookies can use the `Domain` attribute to specify subdomains that have access to the cookies. (This is why for authentication you should not have example.com/login, but use a subdomain such as login.example.com for cookie.)

## Origin

<img width="1411" alt="origin" src="/images/blog/cookies_same_origin_origin.png">
_Origin_ is defined as the protocol-host-port tuple

## Same Origin Policy

Ensures host document can only be accessed by JavaScript execution context from the same origin.

When a _simple request_ (GET, POST, or HEAD) is made by client, the request may look like the following:

```
GET /some-data HTTP/1.1
Host: api.example.com
Origin: https://www.example.com
```

Origin header is added automatically by the browser.

And the server may responds with the following:

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://www.example.com
Content-Type: application/json
```

Once the browser receives the response, it checks whether the request origin matches the Access-Control-Allow-Origin.

If a non-simple request is made, the browser initiates a preflight request that may look like the following:

```
OPTIONS /some-data HTTP/1.1
Origin: https://example.com
Access-Control-Request-Method: PUT
```

In this case, the browser automatically added the Access-Control-Request-Method header based the request type.

The server then responds with the following:

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET,PUT,HEAD,OPTIONS
```

Now the browser can proceed to make PUT request, which will contain the Origin header just like in simple requests.

It is important to note that the Same Origin Policy is enforced on the client side, browser does the checking and blocking.

### CORS

By setting the `Access-Control-Allow-Origin` header, the server can tell the clients what origins are allowed to access this resource. The value for this header cannot be a list, but you can use wild card character `*`.

## Cookies

Cookies are frequently used in [ambient authority](https://en.wikipedia.org/wiki/Ambient_authority) model, where a browser may include cookies in requests made to corresdponding domains as a way of identifying the user that the requests come from. This may be [exploited by CSRF](/blog/csrf/).

Cookies are sent from server to client using Set-Cookie HTTP header. While a client may make request containing Cookie HTTP header.

## Cookie attributes

#### SameSite

`Set-Cookie: key=value; SameSite=None`
Always send Cookie. This used to be the default until recently.

`Set-Cookie: key=value; SameSite=Lax`
Allow cookies on top-level requests. But withholding cookies on sub resource requests originating from other sites. This is the new default.

`Set-Cookie: key=value; SameSite=Strict`
Only send cookies if the request originates from the website that set the cookie.

#### Secure

`Set-Cookie: key=value; Secure;`
Only send cookie over encrypted protocal (HTTPS).

#### HttpOnly

`Set-Cookie: key=value; HttpOnly;`
Make cookie inaccessible by JavaScript.

#### Domain

`Set-Cookie: key=value; Domain=example.com;`
Defaults to the same host that set the cookie. If subdomain is omitted, the cookie is shared with all subdomains and the domain. If the origin domain is an IP, the cookie's domain will not be set and will only be accessible by the IP address as default domain.

A subdomain can set cookie on its parent domain. An insecure application running on a subdomain can overwrite cookies used by the domain and other subdomains, see [session fixation](https://developer.mozilla.org/en-US/docs/Web/Security/Types_of_attacks#session_fixation), and consider use of cookie prefixes.

#### Path

`Set-Cookie: key=value; Path=/refresh-token;`
Specifies the URL path that must exist in the request URL in order to send the cookie.

#### Expires

`Set-Cookie: key=value; Expires=Thu, 1 Jan 2022 12:00:00 GMT;`
The cookie Expires time corresponds to the client, not server.

#### Max-Age

`Set-Cookie: key=value; Max-Age=3600`
The time in seconds when the cookie will be deleted. If this attribute is set, browser will ignore `Expires`.

---

_Based on [Feross Aboukhadijeh](https://feross.org)'s [lecture](https://youtu.be/0-q69vAYSwo) on web security at Stanford University._
