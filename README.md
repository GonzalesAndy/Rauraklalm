# rauraklalm.at: static website

This is a plain HTML, CSS and JavaScript website, with no build step and no framework. It is deployed to GitHub Pages.

## Structure

```
index.html        Start: hero, welcome, panorama, rooms preview, events, history and song
zimmer.html       Rooms: 4 double and 4 multi-bed rooms, large photos
umgebung.html     Surroundings: interactive map with filters, cards and a list
anreise.html      Directions: address, Postbus 1746, coordinates, route links
kontakt.html      Contact and legal notice (#impressum)
assets/css/       style.css (design), fonts.css (self-hosted fonts)
assets/js/        main.js (DE/EN switch, mobile menu), i18n.js (English texts), map.js (map)
assets/data/      places.geojson (places on the map)
assets/img/       photos, already resized and compressed
assets/fonts/     Bitter and Source Sans 3 (SIL OFL), loaded from the site itself, not from Google
assets/vendor/    MapLibre GL JS 5 (BSD licence), also self-hosted
_redirects        301 redirects from the old .php pages (Cloudflare Pages)
_headers          caching and security headers (Cloudflare Pages)
```

## Preview locally

The map loads its data with `fetch`, so open the site through a small local server rather than by double-clicking the file:

```
cd rauraklalm-site
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

The GitHub Actions workflow deploys the repository root whenever changes are pushed to `main`. There is no build step. After the first successful deployment, the site is available at `https://gonzalesandy.github.io/Rauraklalm/`.

To use a custom domain, add it under the repository's **Settings → Pages → Custom domain** and configure the DNS records shown by GitHub at your domain registrar. The `_headers` and `_redirects` files are Cloudflare-specific and are not applied by GitHub Pages.

## Language switch (DE/EN)

- German is the text written directly in the HTML. English lives in `assets/js/i18n.js` and is matched to the page through `data-i18n="key"` attributes.
- The chosen language is saved in the browser's `localStorage`. No cookies are set.
- The default language comes from the browser: German if the browser is set to German, otherwise English. Old links that end in `?l=en` or `?l=de` still work.
- To change a text, edit the German in the HTML and the matching key in `i18n.js`.

## The map

- The base map comes from [OpenFreeMap](https://openfreemap.org): free, no API key, OpenStreetMap data. `map.js` recolours it at load time to match the site's warm palette and hides points of interest so it looks calmer.
- The places are in `assets/data/places.geojson`. For each place you can fill in:
  - `image`, a picture path such as `"assets/img/places/kaltekuchl.jpg"`. Without one, the card shows "Foto folgt".
  - `text_de` and `text_en`, a short description for the card.
  - `url`, the place's website.
- **The coordinates of the places are approximate.** Check them before going live, for example by right-clicking the spot in Google Maps or OpenStreetMap and copying its coordinates.
- If the map can't load (no WebGL, or the tile service is down), the page shows a message and the full list below still works.

## Before going live

- [ ] **Legal texts** on `kontakt.html#impressum`: paste the complete original wording of the Copyright, Haftungsausschluss and Datenschutzerklärung sections from the old `impressum.php`. The current text is only a short summary of them. Keep the new point about the map tiles in the privacy section, since the map sends visitors' IP addresses to OpenFreeMap.
- [ ] **Mountain panorama credit:** if the photo isn't Andrea's own, add the photographer and licence in the footer. There's a `TODO` comment there.
- [ ] Check the coordinates in `places.geojson`.
- [ ] Optional: add photos and a short description for each place on the map.
- [ ] Optional: a larger version of the hero photo (currently 1064 px wide) would look sharper on big screens.
