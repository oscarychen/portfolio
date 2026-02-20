---
title: "Web security: Content security policy"
description: "Some notes on a security policy that is a pain in the butt to set up for SPA that will fail you security audit without"
pubDate: "Dec 9 2021"
---

CSP limits our site from making requests to other sites, controls what resources the page is allowed to load. It limits the damage even if malicious code is running in a user's browser within our site's context.

## Common examples

- `Content-Security-Policy: default-src ‘self’`
  Prevents loading resources from other domains. Prevents inline scripts, such as `<script>alert('hello')</script>`.

- `Content-Security-Policy: default-src ‘self’ *.trusted.com`
  Allows resources from our site plus a trusted set of subdomains.

- `Content-Security-Policy: default-src ‘self’ *.webmail.com; img-src *`
  Allow resources from our site, including subdomains, but blocks resources from anywhere else. Also allow images to come from anywhere.

- `Content-Security-Policy-Report-Only: default-src ’self’; report-uri https://example.com/report`
  Policy is not enforced, but violations are reported to the provided URL. Good for testing CSP in existing production site. The `repot-uri` attribute may also be used on `Content-Security-Policy` for reporting XSS attacks.

## Common directives for CSP

- `default-src`: serves as fallback for other fetch directives
- `connect-src`: restricts resources from “script interfaces”: fetch, XHR, WebSocket, EventSource, `Navigator.sendBeacon()`, `<a ping>`
- `font-src`: restricts sources for fonts
- `frame-src`: restricts resources for nested browsing contexts: `<frame>`, `<iframe>`
- `img-src`: restricts sources for images, favicon
- `manifest-src`: restricts sources for app manifest files
- `media-src`: restricts sources for media: `<audio>`, `<video>`, and `<track>`
- `object-src`: restricts legacy plugins: `<object>`, `<embed>`, and `<applet>`
- `script-src`: restricts sources for `<script>` elements
- `style-src`: restricts sources for `<style>`, `<link rel=‘stylesheet’>` elements
- `worker-src`: restricts sources for Worker, SharedWorker, and ServiceWorker

## Other CSP directives

These directives do not inherit from `default-src`, if left unspecified they allow everything!

- `base-uri`: restricts URLs which can be used in `<base>`
- `form-action`: restricts URLs which can be used as target of form submission
- `frame-ancestors`: restricts parents which may embed this page using `<frame>`, `<iframe>`
- `navigate-to`: restricts URLs to which a document can initiate navigation by any means
- `upgrade-insecure-requests`: instructs browser to treat all HTTP URLs as the HTTPS equivalent transparently

## Limitations

Sometimes the CSP will break your site when you include sources such as Google Analytics, because Google’s scripts include inline scripts or images. To get around it:

```
Content-Security-Policy: default-src: ‘self’; img-src: *; script-src: ‘self’ https://www.google-analytics.com ‘unsafe-inline’
```

This still would not work if the script includes a script from yet another domain. Statistically this is an issue that makes CSP not very useful in practice. Therefore `strict-dynamic` is introduced.

## CSP `strict-dynamic` directive

```
Content-Security-Policy: script-src ‘strict-dynamic’ ’nonce-abc123…’
```

This species that the trust explicitly given to a script present in the markup by accompanying it with a nonce, shall be propagated to all the scripts loaded by that script.
The script now must include a matching nounce:

```
<script src='https://trusted.com/good.js' nonce='abc123…’></script>
```

When `strict-dynamic` is used, any whitelist or source expressions such as ‘self’ or ‘unsafe-inline’ will be ignored, but it’s good to keep full list of allowed origin as a fallback in unsupported browsers.

Finally, a CSP "starter" example:

```
Content-Security-Policy: default-src ‘self’ data:; img-src *; object-src ‘none’; script-src ‘strict-dynamic’ ‘nounce-abc123…’ * ‘unsafe-inline’; style-src ‘self’ ‘unsafe-inline’; base-uri ‘none’; frame-ancestors ‘none’; form-action ‘self’;
```

---

_Based on [Feross Aboukhadijeh](https://feross.org)'s [lecture](https://youtu.be/PlXzrtheQGc) on web security at Stanford University._
