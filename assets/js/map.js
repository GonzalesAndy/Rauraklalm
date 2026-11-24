/* Rauraklalm: surroundings map (MapLibre GL + OpenFreeMap tiles, no API key).
   Data: assets/data/places.geojson: add photos/descriptions there (image, text_de, text_en). */
(function () {
  "use strict";

  var STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
  var EN = window.RAURAKL_EN || {};
  var fallback = document.getElementById("map-fallback");
  var listEl = document.getElementById("place-list");
  var chips = document.querySelectorAll(".chip[data-cat]");
  var canHover = window.matchMedia("(hover: hover)").matches;

  var data = null, map = null, popup = null;
  var markers = {};        // id -> { marker, el, feature }
  var activeCat = "all";
  var activeId = null;

  function lang() { return window.RAURAKL_LANG === "en" ? "en" : "de"; }
  function t(key, de) { return lang() === "en" && EN[key] ? EN[key] : de; }

  function showError() {
    if (!fallback) return;
    fallback.textContent = t("area.error", "Die Karte konnte nicht geladen werden. Alle Ausflugsziele finden Sie in der Liste unten.");
    fallback.hidden = false;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHTML(f) {
    var p = f.properties, l = lang(), cat = data.categories[p.cat];
    var dist = p.dist_km == null ? t("dist.onsite", "Vor Ort") : p.dist_km + " km";
    var text = l === "en" ? (p.text_en || p.text_de) : p.text_de;
    var place = l === "en" ? p.place_en : p.place_de;
    var host = p.url ? p.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "") : "";
    return '<div class="place-card">' +
      (p.image
        ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">'
        : '<div class="no-photo">' + esc(t("area.nophoto", "Foto folgt")) + "</div>") +
      '<div class="body">' +
      '<div class="meta"><span class="cat" style="color:' + cat.color + '">' + esc(cat[l]) + '</span><span class="dist">' + esc(dist) + "</span></div>" +
      '<span class="name">' + esc(p.name) + "</span>" +
      '<span class="desc">' + esc(place) + (text ? ": " + esc(text) : "") + "</span>" +
      (p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(host) + " ↗</a>" : "") +
      "</div></div>";
  }

  function openCard(id, fly) {
    var m = markers[id];
    if (!m || !map) return;
    if (activeId && markers[activeId]) markers[activeId].el.classList.remove("is-active");
    activeId = id;
    m.el.classList.add("is-active");
    popup.setLngLat(m.feature.geometry.coordinates).setHTML(cardHTML(m.feature)).addTo(map);
    if (fly) map.easeTo({ center: m.feature.geometry.coordinates, zoom: Math.max(map.getZoom(), 10.5), duration: 600 });
  }

  function visibleFeatures() {
    return data.features.filter(function (f) { return activeCat === "all" || f.properties.cat === activeCat; });
  }

  function fitTo(features, animate) {
    var b = new maplibregl.LngLatBounds();
    b.extend([data.home.lon, data.home.lat]);
    features.forEach(function (f) { b.extend(f.geometry.coordinates); });
    map.fitBounds(b, { padding: { top: 60, bottom: 40, left: 40, right: 40 }, maxZoom: 12, duration: animate ? 700 : 0 });
  }

  function applyFilter(cat) {
    activeCat = cat;
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-cat") === cat)); });
    if (listEl) {
      listEl.querySelectorAll("li[data-cat]").forEach(function (li) {
        li.hidden = !(cat === "all" || li.getAttribute("data-cat") === cat);
      });
    }
    if (!map) return;
    popup.remove();
    Object.keys(markers).forEach(function (id) {
      var m = markers[id];
      m.el.style.display = (cat === "all" || m.feature.properties.cat === cat) ? "" : "none";
    });
    fitTo(visibleFeatures(), true);
  }

  // Filters and list work even if the map fails.
  chips.forEach(function (c) {
    c.addEventListener("click", function () { applyFilter(c.getAttribute("data-cat")); });
  });

  function warmUpStyle() {
    // Gently recolour the default style towards the site's warm palette and hide POI clutter.
    var layers = (map.getStyle() || {}).layers || [];
    layers.forEach(function (l) {
      try {
        if (l.type === "background") map.setPaintProperty(l.id, "background-color", "#F3ECE1");
        else if (l.type === "fill" && /water/.test(l.id)) map.setPaintProperty(l.id, "fill-color", "#C7DCE0");
        else if (l.type === "fill" && /(wood|forest)/.test(l.id)) map.setPaintProperty(l.id, "fill-color", "#D3E0C9");
        else if (l.type === "fill" && /(grass|park|meadow|landcover)/.test(l.id)) map.setPaintProperty(l.id, "fill-color", "#E2E8D5");
        else if (l.type === "symbol" && /^poi/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
      } catch (e) { /* layer not styleable. Ignore */ }
    });
  }

  function buildMarkers() {
    // Home marker
    var home = document.createElement("div");
    home.className = "home-pin";
    home.innerHTML = '<span class="house"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 20V10l9-6 9 6v10Z"/><path d="M9.5 20v-5h5v5"/></svg></span><span class="name">Rauraklalm</span>';
    new maplibregl.Marker({ element: home, anchor: "top" }).setLngLat([data.home.lon, data.home.lat]).setOffset([0, -23]).addTo(map);

    data.features.forEach(function (f) {
      var p = f.properties;
      var el = document.createElement("button");
      el.type = "button";
      el.className = "pin";
      el.textContent = p.n;
      el.style.background = data.categories[p.cat].color;
      el.setAttribute("aria-label", p.name);
      el.addEventListener("click", function (e) { e.stopPropagation(); openCard(p.id, false); });
      if (canHover) el.addEventListener("mouseenter", function () { openCard(p.id, false); });
      var marker = new maplibregl.Marker({ element: el }).setLngLat(f.geometry.coordinates).addTo(map);
      markers[p.id] = { marker: marker, el: el, feature: f };
    });
  }

  function initMap() {
    if (typeof maplibregl === "undefined") { showError(); return; }
    try {
      map = new maplibregl.Map({
        container: "map",
        style: STYLE_URL,
        center: [data.home.lon, data.home.lat],
        zoom: 9.5,
        cooperativeGestures: true,
        attributionControl: { compact: true }
      });
    } catch (e) { showError(); return; }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    popup = new maplibregl.Popup({ offset: 20, maxWidth: "300px", closeButton: true, focusAfterOpen: false });
    popup.on("close", function () {
      if (activeId && markers[activeId]) markers[activeId].el.classList.remove("is-active");
      activeId = null;
    });

    var loaded = false;
    map.on("load", function () {
      loaded = true;
      if (fallback) fallback.hidden = true;
      warmUpStyle();
      buildMarkers();
      fitTo(visibleFeatures(), false);
    });
    map.on("error", function () { if (!loaded) showError(); });
    setTimeout(function () { if (!loaded) showError(); }, 12000);

    // List interaction
    if (listEl) {
      listEl.querySelectorAll("button[data-place]").forEach(function (b) {
        var id = b.getAttribute("data-place");
        b.addEventListener("click", function () {
          document.querySelector(".map-box").scrollIntoView({ behavior: "smooth", block: "center" });
          openCard(id, true);
        });
        if (canHover) b.addEventListener("mouseenter", function () { if (loaded) openCard(id, false); });
      });
    }

    document.addEventListener("langchange", function () {
      if (activeId && popup.isOpen()) popup.setHTML(cardHTML(markers[activeId].feature));
    });
  }

  fetch("assets/data/places.geojson")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (json) { data = json; initMap(); })
    .catch(showError);
})();
