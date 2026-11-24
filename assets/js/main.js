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
                 if (el.hasAttribute(a[0])) o.attrs[a[1]] = el.getAttribute(a[0]);
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

   // Let visitors inspect any content photo at its full size.
   var main = document.querySelector("main");
    if (main) {
          var viewer = document.createElement("dialog");
          viewer.className = "image-viewer";
          viewer.innerHTML = '<button class="image-viewer-close" type="button">×</button>' +
                  '<img class="image-viewer-image" alt="">' +
                  '<p class="image-viewer-caption"></p>';
          document.body.appendChild(viewer);

      if (typeof viewer.showModal === "function") {
              var closeButton = viewer.querySelector(".image-viewer-close");
              var viewerImage = viewer.querySelector(".image-viewer-image");
              var caption = viewer.querySelector(".image-viewer-caption");
              var activeImage = null;

            function viewerText(alt) {
                      var prefix = document.documentElement.lang === "en" ? "View larger image: " : "Bild vergrößern: ";
                      return prefix + alt;
            }

            function prepareImage(image) {
                      if (!image.alt || image.hasAttribute("data-no-zoom") || image.closest(".image-viewer")) return;
                      image.classList.add("image-zoomable");
                      image.setAttribute("tabindex", "0");
                      image.setAttribute("role", "button");
                      image.setAttribute("aria-haspopup", "dialog");
                      image.setAttribute("aria-label", viewerText(image.alt));
            }

            function prepareImages(root) {
                      if (root.nodeType !== 1) return;
                      if (root.tagName === "IMG") prepareImage(root);
                      root.querySelectorAll("img").forEach(prepareImage);
            }

            function updateViewer() {
                      if (!activeImage) return;
                      var image = activeImage;
                      viewerImage.src = image.currentSrc || image.src;
                      viewerImage.alt = image.alt;

                var figure = image.closest("figure");
                      var figcaption = figure && figure.querySelector("figcaption");
                      caption.textContent = figcaption ? figcaption.textContent.trim() : image.alt;
                      viewer.setAttribute("aria-label", viewerText(image.alt));
                      closeButton.setAttribute("aria-label", document.documentElement.lang === "en" ? "Close enlarged image" : "Großansicht schließen");
            }

            function openImage(image) {
                      activeImage = image;
                      updateViewer();
                      viewer.showModal();
                      closeButton.focus();
            }

            prepareImages(main);
              new MutationObserver(function (records) {
                        records.forEach(function (record) {
                                    record.addedNodes.forEach(prepareImages);
                        });
              }).observe(main, { childList: true, subtree: true });

            document.addEventListener("click", function (event) {
                      var image = event.target.closest && event.target.closest("main img");
                      if (!image || image.closest(".image-viewer")) return;
                      prepareImage(image);
                      if (!image.classList.contains("image-zoomable")) return;
                      event.preventDefault();
                      event.stopPropagation();
                      openImage(image);
            });

            document.addEventListener("keydown", function (event) {
                      var image = event.target;
                      if (event.key === "Escape" && viewer.open) {
                                  event.preventDefault();
                                  viewer.close();
                                  return;
                      }
                      if ((event.key === "Enter" || event.key === " ") &&
                                      image.matches && image.matches("main img.image-zoomable")) {
                                  event.preventDefault();
                                  openImage(image);
                      }
            });

            closeButton.addEventListener("click", function () { viewer.close(); });
              viewer.addEventListener("click", function (event) {
                        if (event.target === viewer) viewer.close();
              });
              viewer.addEventListener("close", function () {
                        if (activeImage && activeImage.isConnected) activeImage.focus();
                        activeImage = null;
              });

            document.addEventListener("langchange", function () {
                      main.querySelectorAll("img").forEach(prepareImage);
                      updateViewer();
            });
      } else {
              viewer.remove();
      }
    }
})();
