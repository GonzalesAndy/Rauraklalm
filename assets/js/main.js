/* Rauraklalm: language switch (DE/EN) and mobile menu. No cookies, no tracking. */
(function () {
  "use strict";

  var EN = window.RAURAKL_EN || {};
  var STORE_KEY = "rauraklalm-lang";
  var originals = new Map();   // element -> { html, attrs } in German

  function decode(str) {
    var d = document.createElement("div");
    d.innerHTML = str;
    return d.textContent;
  }

  function getSaved() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* private mode etc. */ }
  }

  function initialLang() {
    var q = new URLSearchParams(location.search).get("l") || new URLSearchParams(location.search).get("lang");
    if (q === "en" || q === "de") return q;
    var saved = getSaved();
    if (saved === "en" || saved === "de") return saved;
    var nav = (navigator.language || "de").toLowerCase();
    return nav.indexOf("de") === 0 ? "de" : "en";
  }

  var ATTRS = [
    ["data-i18n-alt", "alt"],
    ["data-i18n-aria", "aria-label"],
    ["data-i18n-href", "href"],
    ["data-i18n-content", "content"]
  ];

  function remember(el) {
    if (originals.has(el)) return originals.get(el);
    var o = { html: el.innerHTML, attrs: {} };
    ATTRS.forEach(function (a) {
      if (el.hasAttribute(a[0])) o.attrs[a[1]] = el.getAttribute(a[1]);
    });
    originals.set(el, o);
    return o;
  }

  function apply(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var o = remember(el);
      var key = el.getAttribute("data-i18n");
      if (el.tagName === "TITLE") {
        document.title = lang === "en" && EN[key] ? decode(EN[key]) : decode(o.html);
        return;
      }
      el.innerHTML = lang === "en" && EN[key] !== undefined ? EN[key] : o.html;
    });

    ATTRS.forEach(function (a) {
      document.querySelectorAll("[" + a[0] + "]").forEach(function (el) {
        var o = remember(el);
        var key = el.getAttribute(a[0]);
        var val = lang === "en" && EN[key] !== undefined ? decode(EN[key]) : o.attrs[a[1]];
        if (val !== undefined && val !== null) el.setAttribute(a[1], val);
      });
    });

    document.querySelectorAll(".lang-switch [data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });

    window.RAURAKL_LANG = lang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  // Remember German originals before anything changes.
  document.querySelectorAll("[data-i18n], [data-i18n-alt], [data-i18n-aria], [data-i18n-href], [data-i18n-content]").forEach(remember);

  document.querySelectorAll(".lang-switch [data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      var lang = b.getAttribute("data-lang");
      save(lang);
      apply(lang);
    });
  });

  var lang = initialLang();
  if (lang !== "de") apply(lang); else window.RAURAKL_LANG = "de";

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
})();
