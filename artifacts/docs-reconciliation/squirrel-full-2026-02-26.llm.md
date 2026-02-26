<?xml version="1.0" encoding="UTF-8"?>
<audit version="0.0.33">
<site url="http://localhost:3000" crawled="10" date="2026-02-26T13:51:54.643Z"/>
<score overall="63" grade="D">
 <cat name="Security" score="58"/>
 <cat name="Core SEO" score="90"/>
 <cat name="Content" score="71"/>
 <cat name="Performance" score="77"/>
 <cat name="Accessibility" score="94"/>
 <cat name="Crawlability" score="86"/>
 <cat name="Links" score="89"/>
 <cat name="E-E-A-T" score="100"/>
 <cat name="Internationalization" score="100"/>
 <cat name="Images" score="100"/>
 <cat name="Legal Compliance" score="100"/>
 <cat name="Local SEO" score="100"/>
 <cat name="Mobile" score="100"/>
 <cat name="Structured Data" score="100"/>
 <cat name="Social Media" score="100"/>
 <cat name="URL Structure" score="100"/>
</score>
<summary passed="852" warnings="74" failed="32"/>
<issues>
 <category name="Crawlability" errors="1" warnings="2">
  <rule id="crawl/sitemap-domain" severity="error" status="fail" docs="https://docs.squirrelscan.com/rules/crawl/sitemap-domain">
   20 URL(s) point to different domain(s)
   Items (20):
    - https://proofound.io/ [host: proofound.io]
    - https://proofound.io/about [host: proofound.io]
    - https://proofound.io/manifesto [host: proofound.io]
    - https://proofound.io/careers [host: proofound.io]
    - https://proofound.io/contact [host: proofound.io]
    - https://proofound.io/support [host: proofound.io]
    - https://proofound.io/privacy [host: proofound.io]
    - https://proofound.io/terms [host: proofound.io]
    - https://proofound.io/cookies [host: proofound.io]
    - https://proofound.io/cookies/settings [host: proofound.io]
    - https://proofound.io/ [host: proofound.io]
    - https://proofound.io/about [host: proofound.io]
    - https://proofound.io/manifesto [host: proofound.io]
    - https://proofound.io/careers [host: proofound.io]
    - https://proofound.io/contact [host: proofound.io]
    - https://proofound.io/support [host: proofound.io]
    - https://proofound.io/privacy [host: proofound.io]
    - https://proofound.io/terms [host: proofound.io]
    - https://proofound.io/cookies [host: proofound.io]
    - https://proofound.io/cookies/settings [host: proofound.io]
  </rule>
  <rule id="crawl/sitemap-coverage" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/crawl/sitemap-coverage">
   10 indexable page(s) not in sitemap (100%); 10 sitemap URL(s) were not crawled
   Items (20):
    - /
    - /about
    - /careers
    - /contact
    - /support
    - /manifesto
    - /privacy
    - /terms
    - /cookies
    - /cookies/settings
    - https://proofound.io/
    - https://proofound.io/about
    - https://proofound.io/manifesto
    - https://proofound.io/careers
    - https://proofound.io/contact
    - https://proofound.io/support
    - https://proofound.io/privacy
    - https://proofound.io/terms
    - https://proofound.io/cookies
    - https://proofound.io/cookies/settings
  </rule>
 </category>
 <category name="Core SEO" errors="10" warnings="0">
  <rule id="core/charset" severity="warning" status="fail" docs="https://docs.squirrelscan.com/rules/core/charset">
   No charset declaration found
   Pages (10): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies, /cookies/settings
  </rule>
 </category>
 <category name="Security" errors="10" warnings="2">
  <rule id="security/leaked-secrets" severity="error" status="warn" docs="https://docs.squirrelscan.com/rules/security/leaked-secrets">
   46 potential secret(s) detected (verify manually)
   Items (46):
    - DigitalOcean Spaces Key: DO29CQ********************FBLE (Found in external-script (http://localhost:3000/_next/static/chunks/app-pages-internals.js))
    - DigitalOcean Spaces Key: DO29CQ********************FBLE (Found in external-script (http://localhost:3000/_next/static/chunks/app-pages-internals.js))
    - Sanity Token: ske0pT********************IiJ9 (Found in external-script (http://localhost:3000/_next/static/chunks/app-pages-internals.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBR**************CQUF (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DOEI7O*****************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ****************3FCO (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQS (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDWD (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ**************BQ0E (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO1FBQ**************CQUF (Found in external-script (http://localhost:3000/_next/static/chunks/app/not-found.js))
    - DigitalOcean Spaces Key: DO1FBQ********************BQ0F (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO1FBQ**************BQ0F (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDRD (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQS (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQS (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO1FBQ*************FDTD (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - DigitalOcean Spaces Key: DO0FBQ********************BQWE (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: ske2Rl********************iIn0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - Sanity Token: ske2V9********************yfSg (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: ske2V9********************6YCg (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: skLy50********************yKT0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: skfSR7********************uYCg (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: skfWA7********************uYCg (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: skLnB1********************9dD0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/page.js))
    - Sanity Token: skL2cs********************pID0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/error.js))
    - Supabase Anon Key: eyJhbG********************3MX0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO1FBR*************FDVD (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDUD (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ*************FDQT (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO2FBR*************NBQV (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO1FBQ**************BQVE (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBR**************CQUF (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBR********************BQWN (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO1FBQ*************FDTC (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ********************UFDU (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - DigitalOcean Spaces Key: DO0FBQ**************BQWE (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - Sanity Token: ske3Bh********************iIn0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - Sanity Token: ske2h9********************oKT0 (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
    - Sanity Token: skIGFz********************IifQ (Found in external-script (http://localhost:3000/_next/static/chunks/app/layout.js))
  </rule>
  <rule id="security/https" severity="error" status="fail" docs="https://docs.squirrelscan.com/rules/security/https">
   Page not served over HTTPS
   Pages (10): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies, /cookies/settings
  </rule>
  <rule id="security/csp" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/security/csp">
   CSP allows &apos;unsafe-inline&apos; and &apos;unsafe-eval&apos;
  </rule>
 </category>
 <category name="Links" errors="0" warnings="2">
  <rule id="links/orphan-pages" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/links/orphan-pages">
   3 orphan page(s) with &lt;2 incoming links
   Items (3):
    - /about
    - /careers
    - /manifesto
  </rule>
  <rule id="links/weak-internal-links" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/links/weak-internal-links">
   3 page(s) have only 1 internal link
   Items (3):
    - /about
    - /careers
    - /manifesto
  </rule>
 </category>
 <category name="Content" errors="9" warnings="8">
  <rule id="content/meta-in-body" severity="error" status="fail" docs="https://docs.squirrelscan.com/rules/content/meta-in-body">
   Found 15 meta tags in &lt;body&gt;; Found 14 meta tags in &lt;body&gt;
   Pages (9): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies
   Items (29):
    - description (description=&quot;Proofound helps individuals and organizations publ...&quot;) [content: Proofound helps individuals and organizations publ...]
    - keywords (keywords=&quot;Proofound,public portfolio,proof-based portfolio,v...&quot;) [content: Proofound,public portfolio,proof-based portfolio,v...]
    - og:title (og:title=&quot;Proofound | Public Proof Portfolio, Ready to Share&quot;) [content: Proofound | Public Proof Portfolio, Ready to Share]
    - og:description (og:description=&quot;Create a clean proof-based public portfolio link o...&quot;) [content: Create a clean proof-based public portfolio link o...]
    - og:url (og:url=&quot;https://proofound.io&quot;) [content: https://proofound.io]
    - og:site_name (og:site_name=&quot;Proofound&quot;) [content: Proofound]
    - og:image (og:image=&quot;https://proofound.io/hero-visual.jpg&quot;) [content: https://proofound.io/hero-visual.jpg]
    - og:image:width (og:image:width=&quot;1200&quot;) [content: 1200]
    - og:image:height (og:image:height=&quot;630&quot;) [content: 630]
    - og:image:alt (og:image:alt=&quot;Proofound credibility platform landing page&quot;) [content: Proofound credibility platform landing page]
    - og:type (og:type=&quot;website&quot;) [content: website]
    - twitter:card (twitter:card=&quot;summary_large_image&quot;) [content: summary_large_image]
    - twitter:title (twitter:title=&quot;Proofound | Public Proof Portfolio&quot;) [content: Proofound | Public Proof Portfolio]
    - twitter:description (twitter:description=&quot;Publish a clean public proof portfolio link today,...&quot;) [content: Publish a clean public proof portfolio link today,...]
    - twitter:image (twitter:image=&quot;https://proofound.io/hero-visual.jpg&quot;) [content: https://proofound.io/hero-visual.jpg]
    - description (description=&quot;Learn why Proofound replaces resume noise with ver...&quot;) [content: Learn why Proofound replaces resume noise with ver...]
    - og:title (og:title=&quot;About Proofound | Trust-first expertise platform&quot;) [content: About Proofound | Trust-first expertise platform]
    - og:description (og:description=&quot;Learn why Proofound replaces resume noise with ver...&quot;) [content: Learn why Proofound replaces resume noise with ver...]
    - og:url (og:url=&quot;https://proofound.io/about&quot;) [content: https://proofound.io/about]
    - og:site_name (og:site_name=&quot;Proofound&quot;) [content: Proofound]
    - og:image (og:image=&quot;https://proofound.io/hero-visual.jpg&quot;) [content: https://proofound.io/hero-visual.jpg]
    - og:image:width (og:image:width=&quot;1200&quot;) [content: 1200]
    - og:image:height (og:image:height=&quot;630&quot;) [content: 630]
    - og:image:alt (og:image:alt=&quot;Proofound public page preview&quot;) [content: Proofound public page preview]
    - og:type (og:type=&quot;website&quot;) [content: website]
    - twitter:card (twitter:card=&quot;summary_large_image&quot;) [content: summary_large_image]
    - twitter:title (twitter:title=&quot;About Proofound | Trust-first expertise platform&quot;) [content: About Proofound | Trust-first expertise platform]
    - twitter:description (twitter:description=&quot;Learn why Proofound replaces resume noise with ver...&quot;) [content: Learn why Proofound replaces resume noise with ver...]
    - twitter:image (twitter:image=&quot;https://proofound.io/hero-visual.jpg&quot;) [content: https://proofound.io/hero-visual.jpg]
  </rule>
  <rule id="content/keyword-stuffing" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/content/keyword-stuffing">
   1 word(s) may be overused
   Pages (1): /cookies/settings
   Items (1):
    - your (&quot;your&quot; (5.1%)) [count: 10, density: 5.1020408163265305]
  </rule>
  <rule id="content/word-count" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/content/word-count">
   Thin content: 273 words (min 300); Thin content: 261 words (min 300); Thin content: 233 words (min 300); Thin content: 211 words (min 300); Thin content: 267 words (min 300); Thin content: 244 words (min 300); Thin content: 219 words (min 300)
   Pages (7): /about, /careers, /contact, /support, /manifesto, /cookies, /cookies/settings
  </rule>
 </category>
 <category name="Performance" errors="1" warnings="52">
  <rule id="perf/lcp-hints" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/perf/lcp-hints">
   3 potential LCP image(s) without preload
   Pages (1): /
   Items (3):
    - /logo.png
    - /_next/image?url=%2Fhero-shape.png&amp;w=3840&amp;q=55
    - /logo.png
  </rule>
  <rule id="perf/css-file-size" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/perf/css-file-size">
   10 CSS file(s) exceed 100.0 KB
   Items (10):
    - /_next/static/css/app/layout.css?v=1772113915434 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /)
    - /_next/static/css/app/layout.css?v=1772113915967 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /about)
    - /_next/static/css/app/layout.css?v=1772113916021 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /careers)
    - /_next/static/css/app/layout.css?v=1772113916417 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /contact)
    - /_next/static/css/app/layout.css?v=1772113916471 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /support)
    - /_next/static/css/app/layout.css?v=1772113916817 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /manifesto)
    - /_next/static/css/app/layout.css?v=1772113917196 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /privacy)
    - /_next/static/css/app/layout.css?v=1772113917252 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /terms)
    - /_next/static/css/app/layout.css?v=1772113917597 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /cookies)
    - /_next/static/css/app/layout.css?v=1772113917935 [sizeBytes: 204848, size: 200.0 KB, status: 200, contentType: text/css; charset=UTF-8] (from: /cookies/settings)
  </rule>
  <rule id="perf/total-byte-weight" severity="warning" status="fail" docs="https://docs.squirrelscan.com/rules/perf/total-byte-weight">
   Total tracked resources: 37260KB (very heavy)
  </rule>
  <rule id="perf/critical-request-chains" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/perf/critical-request-chains">
   2 critical request chain(s) found
   Pages (10): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies, /cookies/settings
   Items (11):
    - CSS: /_next/static/css/app/layout.css?v=1772113915434
    - JS: /_next/static/chunks/polyfills.js
    - CSS: /_next/static/css/app/layout.css?v=1772113915967
    - CSS: /_next/static/css/app/layout.css?v=1772113916021
    - CSS: /_next/static/css/app/layout.css?v=1772113916417
    - CSS: /_next/static/css/app/layout.css?v=1772113916471
    - CSS: /_next/static/css/app/layout.css?v=1772113916817
    - CSS: /_next/static/css/app/layout.css?v=1772113917196
    - CSS: /_next/static/css/app/layout.css?v=1772113917252
    - CSS: /_next/static/css/app/layout.css?v=1772113917597
    - CSS: /_next/static/css/app/layout.css?v=1772113917935
  </rule>
  <rule id="perf/unminified-js" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/perf/unminified-js">
   7 JavaScript file(s) appear unminified
   Pages (10): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies, /cookies/settings
   Items (5):
    - app-pages-internals.js (229.1KB, ~226.1KB savings) [reason: 181 comments, long function names, excessive whitespace]
    - page.js (3853.2KB, ~3456.1KB savings) [reason: 7719 comments, long function names, excessive whitespace]
    - global-error.js (345.9KB, ~372.9KB savings) [reason: 600 comments, long function names, excessive whitespace]
    - layout.js (3510.9KB, ~3508.6KB savings) [reason: 4642 comments, long function names, excessive whitespace]
    - error.js (342.4KB, ~368.2KB savings) [reason: 595 comments, long function names, excessive whitespace]
  </rule>
  <rule id="perf/http2" severity="info" status="warn" docs="https://docs.squirrelscan.com/rules/perf/http2">
   HTTP/2 requires HTTPS
   Pages (10): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies, /cookies/settings
  </rule>
  <rule id="perf/source-maps" severity="info" status="warn" docs="https://docs.squirrelscan.com/rules/perf/source-maps">
   125 potential source map(s) detected; 650 inline source map(s) found; 74 potential source map(s) detected; 236 inline source map(s) found
   Pages (10): /, /about, /careers, /contact, /support, /manifesto, /privacy, /terms, /cookies, /cookies/settings
   Items (26):
    - /_next/static/chunks/bfcache.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/client-page.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/client-segment.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/layout-router.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/async-metadata.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/render-from-template-context.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/params.browser.dev.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/params.browser.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/search-params.browser.dev.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/search-params.browser.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/app-pages-internals.js
    - /_next/static/chunks/app-pages-internals.js
    - /_next/static/chunks/app-pages-internals.js
    - /_next/static/chunks/bfcache.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/client-page.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/client-segment.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/layout-router.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/async-metadata.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/render-from-template-context.js.map/nvar (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/params.browser.dev.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/params.browser.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/search-params.browser.dev.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/search-params.browser.js.map/n/n/n;/n (from /_next/static/chunks/app-pages-internals.js)
    - /_next/static/chunks/app-pages-internals.js
    - /_next/static/chunks/app-pages-internals.js
    - /_next/static/chunks/app-pages-internals.js
  </rule>
 </category>
 <category name="Accessibility" errors="1" warnings="8">
  <rule id="a11y/duplicate-id-aria" severity="error" status="fail" docs="https://docs.squirrelscan.com/rules/a11y/duplicate-id-aria">
   Rule error: CSS is not defined
   Pages (1): /
  </rule>
  <rule id="a11y/color-contrast" severity="warning" status="warn" docs="https://docs.squirrelscan.com/rules/a11y/color-contrast">
   15 potential color contrast issue(s); 4 potential color contrast issue(s); 5 potential color contrast issue(s); 6 potential color contrast issue(s)
   Pages (8): /, /about, /careers, /contact, /manifesto, /cookies, /support, /cookies/settings
   Items (26):
    - div with class &quot;absolute inset-0 opacity-40 da...&quot; may have low contrast
    - p with class &quot;text-lg md:text-xl text-muted-...&quot; may have low contrast
    - path with class &quot;opacity-20...&quot; may have low contrast
    - p with class &quot;text-xl md:text-2xl text-muted...&quot; may have low contrast
    - div with class &quot;absolute top-[15%] left-[-15%]...&quot; may have low contrast
    - div with class &quot;absolute top-[5%] right-[-15%]...&quot; may have low contrast
    - button with class &quot;text-left text-sm font-medium ...&quot; may have low contrast
    - div with class &quot;step-card group bg-card/60 bac...&quot; may have low contrast
    - span with class &quot;text-lg md:text-2xl font-displ...&quot; may have low contrast
    - p with class &quot;text-muted-foreground leading-...&quot; may have low contrast
    - p with class &quot;text-xs font-semibold uppercas...&quot; may have low contrast
    - p with class &quot;text-base text-muted-foregroun...&quot; may have low contrast
    - p with class &quot;text-base leading-relaxed text...&quot; may have low contrast
    - p with class &quot;text-sm text-muted-foreground...&quot; may have low contrast
    - div with class &quot;space-y-4 text-base leading-re...&quot; may have low contrast
    - p with class &quot;text-xs font-semibold uppercas...&quot; may have low contrast
    - p with class &quot;text-base text-muted-foregroun...&quot; may have low contrast
    - p with class &quot;text-base leading-relaxed text...&quot; may have low contrast
    - ul with class &quot;list-disc space-y-2 pl-6 text-...&quot; may have low contrast
    - p with class &quot;text-sm text-muted-foreground...&quot; may have low contrast
    - a with class &quot;flex items-center gap-2 text-s...&quot; may have low contrast
    - p with class &quot;text-lg text-muted-foreground ...&quot; may have low contrast
    - p with class &quot;text-muted-foreground...&quot; may have low contrast
    - p with class &quot;text-sm leading-6 text-muted-f...&quot; may have low contrast
    - p with class &quot;text-sm text-muted-foreground...&quot; may have low contrast
    - div with class &quot;container mx-auto px-4 text-ce...&quot; may have low contrast
  </rule>
 </category>
</issues>
</audit>
