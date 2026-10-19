# Website prototype (demo)

A single static page (`index.html`) used to try out the design and the booking button.
**All content is made up**: salon name, address, phone, prices and reviews.
This is not the real website, and the stack is still undecided (see `docs/open-questions.md`).

- Design ideas: velvetbeauty.lv, velvetbeauty.sk and silhouette-society.com (layout and style only, with no copied text or images).
- Languages: DE / EN / FR / IT. Switch at the top right, or with `?lang=fr`. The browser language is used by default.
- Booking: **two systems side by side for comparison**. Each booking spot has two buttons, labelled with the platform:
  - gold **Cal.com** button: opens the Cal.com popup for `massage-demo/basic-massage`;
  - green **Dikidi** button: opens the Dikidi widget `https://dikidi.app/#widget=220677` (script `widget2.min.js` from dikidi.app).
  Two floating buttons (bottom right) do the same. Button texts are translated per language; the booking screens inside each popup are in the platform's own languages.
- Wording: beauty and wellness only, with no medical claims. The disclaimer says results vary.
- Treatment: one service only, **anti-cellulite massage** (trial session, single session, packages of 5 and 10). Prices are made up.
- Location: Dorfstrasse 1, 3792 Saanen (sample address). The map uses Leaflet + OpenStreetMap tiles, with no Google API or key.
  - "Get directions" opens Apple Maps on Apple devices and Google Maps elsewhere (plain links, no API).
  - "Copy address" copies the address to the clipboard.
- Parking: car parks and coordinates come from OpenStreetMap (Nominatim, 2026-10-19). Names like "Parkplatz Bahnhofgässli" are taken from the street name, not official names.
  Fees, walking times and the payment-app note `[verify]` locally before launch (Gemeinde Saanen / parking.ch).
- Social links (Instagram, Facebook, YouTube, TikTok, WhatsApp) are placeholders, with empty URLs in `SOCIAL`.
- The floating "Book" button is bottom-right; the floating WhatsApp button was removed. The Cal.com popup uses the light theme.

## Run locally
```
make prototype-serve
```
Then open http://127.0.0.1:8765/

## Publish
`make prototype-publish` force-pushes this folder to the public repo `BONDanil/massage-salon-prototype`.
GitHub Pages serves it at https://bondanil.github.io/massage-salon-prototype/. Everything in this folder becomes public.
