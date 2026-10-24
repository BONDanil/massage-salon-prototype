# Website prototype (demo)

A static demo site used to try out the design, the booking buttons and the technical setup from
[Website: ads, SEO and analytics](../docs/12-website-tech.md).
**All content is made up**: salon name, address, phone, prices and reviews (see `business.demo.yml`).

Plain HTML/CSS/JS, no build step and no generator: **the HTML files are the source**. Edit them directly.

## Structure
```
index.html                  English home page (default language, x-default)
de/ fr/ it/index.html       German, French, Italian home pages; all text in the HTML
imprint/ privacy/, de/impressum/ de/datenschutz/,
fr/mentions-legales/ fr/confidentialite/, it/note-legali/ it/privacy/   legal templates
assets/styles.css           shared styles (fonts self-hosted in assets/fonts/)
assets/main.js              shared behaviour: UTM tags, consent, events, Cal.com, map
assets/vendor/leaflet/      map library (self-hosted)
business.demo.yml           demo business facts; the pages must match it
sitemap.xml, robots.txt
404.html                    "page not found" (English only); links use the full site address
```

## Languages and URLs
- English is the default language at `/`; German, French and Italian at `/de/`, `/fr/`, `/it/`. Every page has `hreflang` tags, a canonical tag and Open Graph tags.
- On `/`, if the browser language is DE, FR or IT, a small dialog asks (in that language) whether to switch. The answer is remembered (`localStorage` key `lang-choice`), so it is asked only once. No automatic redirect. The cookie banner waits until the dialog is closed.
  - The browser language is the visitor's **top preferred language** (`navigator.languages[0]`).
  - **Testing:** open `/?suggest=fr` (or `de`, `it`) to see the dialog regardless of the browser language or a saved answer. To test the real behaviour again, clear the saved answer: `localStorage.removeItem("lang-choice")` in the browser console.
- The language selector (drop-down in the header) keeps the current section: while scrolling, the address follows the section (`#prices`, `#faq` …), so `/#prices` → `/it/#prices`.
- Header: menu, social links (Instagram, Facebook, WhatsApp; YouTube and TikTok are hidden until the accounts exist, see `HIDDEN_SOCIAL`), language selector. On phones the social links are inside the menu.

## Booking
**Cal.com** (decided 2026-10-24): every "Book" button opens the Cal.com popup.
- One event type for all languages: `massage-demo/basic-massage` (`booking.cal_link` in `business.demo.yml`, `data-booking-cal` on each page). The booking screen follows the visitor's browser language.
  A possible workaround (one event type per language with its "Interface Language") is described in docs page 12; not decided yet.
- Cal.com is loaded **only on the first click** on a "Book" button; before that the page makes no request to cal.com.
- The visit's UTM tags and the page language are passed as `metadata[…]` `[verify]` that they appear in the booking.
Never put `data-cal-link` on `<body>` or a wrapper element: Cal.com would open for any click inside it. Page settings use `data-booking-cal` / `data-booking-ns` instead.

## Tracking (placeholders only)
- Cookie banner with Google Consent Mode v2: everything is `denied` until the visitor accepts. "Cookie settings" in the footer reopens it.
- Google tag and Meta Pixel load **only after consent and only with real IDs**. The IDs in `business.demo.yml` / `<body data-ga4 data-pixel>` are placeholders, so nothing is loaded; events are logged to the browser console as `[track] …`.
- Events: `book_click`, `booking_completed` (Cal.com `bookingSuccessfulV2` `[verify]`), `phone_click`, `whatsapp_click`, `email_click`, `directions_click`, `copy_location`, `voucher_click`.
- UTM tags (and `gclid`, `fbclid`) are kept in `sessionStorage` for the visit.

## SEO
- Title, description, canonical, `hreflang` + `x-default`, Open Graph image (`assets/og-image.png`) per page.
- schema.org `HealthAndBeautyBusiness` JSON-LD on each language page, built from the facts.
- `sitemap.xml` with all pages and their language versions. `robots.txt` is ready for the real domain.
- **Demo only:** every page has `<meta name="robots" content="noindex, nofollow">`. Remove it on the real site.

## 404 page
`404.html` is shown for any address that does not exist. GitHub Pages, Cloudflare Pages and Netlify use it automatically; on Apache (e.g. Infomaniak) add `ErrorDocument 404 /404.html` to `.htaccess`.
It can appear at any path, so all its links use the full site address. `make site-check` checks that they match `contact.website`.

## Checks
```
make site-check
```
Compares the pages with `business.demo.yml`:
- name, address, phone, WhatsApp, email, prices and payment methods on every language page;
- schema.org data, opening hours, booking and tracking IDs;
- `hreflang` (complete and pointing both ways), canonical tags, the language switcher, internal links and the sitemap.

The visible opening-hours text (e.g. "Di–Sa 9–19 Uhr") is not checked; update it by hand.
`make prototype-publish` runs this check first.

**When a fact changes** (price, phone, hours): change `business.demo.yml`, run `make site-check`, then fix every line it lists in all four languages.

## Other notes
- Design ideas: velvetbeauty.lv, velvetbeauty.sk and silhouette-society.com (layout and style only, with no copied text or images).
- Wording: beauty and wellness only, with no medical claims. The disclaimer says results vary.
- Location: the map uses Leaflet + OpenStreetMap tiles, with no Google API or key.
- "Get directions": on Android the system asks which app to use (`geo:` link). iPhones and computers have no such system choice for web links, so a small menu offers Google Maps, Apple Maps and Waze.
- Payment: cash only at launch, no cancellation policy (decided 2026-10-24).
- Parking: car parks and coordinates come from OpenStreetMap (Nominatim, 2026-10-19). Fees, walking times and the payment-app note `[verify]` locally before launch.
- Instagram and Facebook links are placeholders (greyed out) until the accounts exist.
- FR/IT texts and legal templates need a check by native speakers; the legal templates need a check by a Swiss fiduciary or lawyer.

## Run locally
```
make prototype-serve
```
Then open http://127.0.0.1:8765/

## Publish
`make prototype-publish` runs `make site-check`, then force-pushes this folder to the public repo `BONDanil/massage-salon-prototype`.
GitHub Pages serves it at https://bondanil.github.io/massage-salon-prototype/. Everything in this folder becomes public.
