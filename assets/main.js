/* Maison Alpin demo: shared script for every page.
   Page texts live in the HTML; this file only adds behaviour.
   Settings come from <body data-…> attributes (see the language pages).
   Never put data-cal-link on <body> or a wrapper: Cal.com opens the popup for any click inside such an element. */
(function () {
  "use strict";

  const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  const body = document.body;
  const cfg = body.dataset;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const store = {
    get(area, key) { try { return window[area].getItem(key); } catch (_) { return null; } },
    set(area, key, value) { try { window[area].setItem(key, value); } catch (_) {} },
  };

  /* ---------- 1. UTM tags: remember them for this visit (also on the root page) ---------- */
  const params = new URLSearchParams(location.search);
  const fromUrl = Object.fromEntries(TRACKING_KEYS.filter(k => params.get(k)).map(k => [k, params.get(k)]));
  if (Object.keys(fromUrl).length) store.set("sessionStorage", "utm", JSON.stringify(fromUrl));
  const utm = (() => { try { return JSON.parse(store.get("sessionStorage", "utm") || "{}"); } catch (_) { return {}; } })();

  /* ---------- 2. Language: suggestion on the English root page, remembered choice ---------- */
  // English is the default at "/". If the browser language is DE, FR or IT and the visitor has not
  // chosen a language before, a small dialog offers that language. No automatic redirect (search engines
  // always see the English page).
  const CHOICE = "lang-choice";
  const langModal = $(".langmodal");
  let modalOpen = false;
  function closeModal() {
    if (!modalOpen) return;
    langModal.hidden = true;
    modalOpen = false;
    showConsentIfNeeded();
  }
  // Test: /?suggest=fr shows the dialog for French even if a choice is saved or the browser is English.
  const forcedSuggest = params.get("suggest");
  if (langModal && (forcedSuggest || !store.get("localStorage", CHOICE))) {
    // The visitor's top preferred language (Chrome: first of "Preferred languages";
    // navigator.language alone is often only the browser's own menu language).
    const browserLang = forcedSuggest || String((navigator.languages && navigator.languages[0]) || navigator.language || "").slice(0, 2).toLowerCase();
    const block = $(`[data-for="${browserLang}"]`, langModal);
    if (block) {
      block.hidden = false;
      langModal.hidden = false;
      modalOpen = true;
      $("a", block).focus();
    }
  }
  // Any explicit choice (dialog or language selector) is remembered, so the dialog does not come back.
  // Links to another language keep the current section (#prices etc.).
  $$("[data-lang-choice]").forEach(el => el.addEventListener("click", () => {
    store.set("localStorage", CHOICE, el.dataset.langChoice);
    if (el.tagName === "A" && location.hash) el.href = el.href.split("#")[0] + location.hash;
    if (el.tagName === "BUTTON") closeModal();
  }));
  if (langModal) {
    langModal.addEventListener("click", e => { if (e.target === langModal) { store.set("localStorage", CHOICE, "en"); closeModal(); } });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && modalOpen) { store.set("localStorage", CHOICE, "en"); closeModal(); } });
  }

  /* ---------- 3. Consent (cookie banner) + Google Consent Mode v2 ---------- */
  // Basic mode: no Google or Meta script is loaded before the visitor agrees.
  // While the IDs are placeholders, nothing is loaded at all; events are only logged to the console.
  const isPlaceholder = id => !id || /X{4,}|^0+$/.test(id);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });
  gtag("js", new Date());

  let loaded = false;
  function loadTags() {
    if (loaded) return;
    loaded = true;
    if (!isPlaceholder(cfg.ga4)) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4)}`;
      document.head.appendChild(s);
      gtag("config", cfg.ga4);
    }
    if (!isPlaceholder(cfg.pixel)) {
      /* Meta Pixel base code */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", cfg.pixel);
      fbq("track", "PageView");
    }
  }

  function setConsent(granted) {
    store.set("localStorage", "consent", granted ? "granted" : "denied");
    const v = granted ? "granted" : "denied";
    gtag("consent", "update", { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
    if (granted) loadTags();
    const banner = $(".consent");
    if (banner) banner.hidden = true;
  }

  const banner = $(".consent");
  const choice = store.get("localStorage", "consent");
  if (choice === "granted") setConsent(true);
  // The cookie banner waits until the language dialog is closed.
  function showConsentIfNeeded() {
    if (banner && !modalOpen && !store.get("localStorage", "consent")) banner.hidden = false;
  }
  showConsentIfNeeded();
  $$("[data-consent]").forEach(b => b.addEventListener("click", () => setConsent(b.dataset.consent === "accept")));
  $$(".js-cookie-settings").forEach(b => b.addEventListener("click", () => { if (banner) banner.hidden = false; }));

  /* ---------- 4. Events: one function for GA4 and Meta ---------- */
  const META_EVENTS = { booking_completed: "Schedule", whatsapp_click: "Contact", phone_click: "Contact", email_click: "Contact" };
  function track(name, extra = {}) {
    const data = { page_language: document.documentElement.lang, ...extra };
    console.debug("[track]", name, data);
    gtag("event", name, data);
    if (window.fbq) META_EVENTS[name] ? fbq("track", META_EVENTS[name]) : fbq("trackCustom", name, data);
  }
  window.track = track;

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-track]");
    if (el) track(el.dataset.track, el.dataset.app ? { app: el.dataset.app } : {});
  });

  /* ---------- 5. Cal.com booking popup: loaded only on the first click on "Book" ---------- */
  // Until then the page makes no request to cal.com at all.
  let calReady = false;
  function loadCal() {
    if (calReady) return;
    calReady = true;
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    Cal("init", cfg.bookingNs, { origin: "https://app.cal.com" });
    Cal.ns[cfg.bookingNs]("ui", { theme: "light", hideEventTypeDetails: false, layout: "month_view" });
    // Booking finished inside the popup → conversion event for GA4 / Meta, with the visit's UTM tags.
    Cal.ns[cfg.bookingNs]("on", { action: "bookingSuccessfulV2", callback: () => track("booking_completed", { ...utm }) }); // [verify] event name in Cal.com docs
  }
  if (cfg.bookingCal) {
    $$(".js-book").forEach(b => b.addEventListener("click", () => {
      loadCal();
      // Pass the UTM tags and page language to the booking, so each booking shows where it came from. [verify] metadata in Cal.com
      const meta = Object.entries({ ...utm, lang: document.documentElement.lang })
        .map(([k, v]) => `metadata[${k}]=${encodeURIComponent(v)}`).join("&");
      Cal.ns[cfg.bookingNs]("modal", {
        calLink: `${cfg.bookingCal}?${meta}`,
        config: { layout: "month_view", useSlotsViewOnSmallScreen: "true", theme: "light" },
      });
    }));
  }

  /* ---------- 6. Header: burger menu, language selector, section in the address ---------- */
  const burger = $(".burger");
  const menu = $("#menu");
  if (burger) burger.addEventListener("click", () => menu.classList.toggle("open"));
  if (menu) $$("a", menu).forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));
  // Close the language selector when clicking elsewhere or pressing Escape.
  document.addEventListener("click", e => $$(".langsel[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; }));
  document.addEventListener("keydown", e => { if (e.key === "Escape") $$(".langsel[open]").forEach(d => { d.open = false; }); });

  // Keep #section in the address in sync while scrolling (without jumping), so the language
  // selector opens the section the visitor is reading now. At the top of the page there is no #.
  const sections = $$("main section[id]");
  if (sections.length) {
    let current = location.hash.slice(1);
    let ticking = false;
    const sync = () => {
      ticking = false;
      const line = window.innerHeight * 0.35;
      let id = "";
      sections.forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) id = sections[sections.length - 1].id; // very bottom: last section
      if (id === current) return;
      current = id;
      history.replaceState(history.state, "", location.pathname + location.search + (id ? "#" + id : ""));
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
  }

  /* ---------- 7. Location: directions, copy address, map ---------- */
  const mapEl = $("#map");
  if (mapEl) {
    const { lat, lng, name, address } = mapEl.dataset;
    // Directions: on Android the system asks which app to use (geo: link). iPhones and computers have no
    // such system choice for web links, so a small menu offers Google Maps, Apple Maps and Waze.
    const dirBtn = $("#directions");
    const dirMenu = $("#dirmenu");
    if (dirBtn && dirMenu) {
      dirBtn.addEventListener("click", () => {
        if (/Android/i.test(navigator.userAgent)) {
          track("directions_click", { app: "android-chooser" });
          location.href = `geo:0,0?q=${lat},${lng}(${encodeURIComponent(name)})`;
          return;
        }
        dirMenu.hidden = !dirMenu.hidden;
        dirBtn.setAttribute("aria-expanded", String(!dirMenu.hidden));
      });
      document.addEventListener("click", e => {
        if (!dirMenu.hidden && !e.target.closest(".dirs")) { dirMenu.hidden = true; dirBtn.setAttribute("aria-expanded", "false"); }
      });
      dirMenu.addEventListener("click", e => { if (e.target.closest("a")) { dirMenu.hidden = true; dirBtn.setAttribute("aria-expanded", "false"); } });
    }

    const copyBtn = $("#copyLoc");
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(address); }
      catch (_) { const t = document.createElement("textarea"); t.value = address; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (_) {} t.remove(); }
      const out = $("#copied");
      out.textContent = copyBtn.dataset.copied;
      setTimeout(() => { out.textContent = ""; }, 2500);
    });

    if (window.L) {
      const map = L.map(mapEl, { scrollWheelZoom: false, fadeAnimation: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      const salon = L.marker([+lat, +lng], { icon: L.divIcon({ className: "", html: '<div class="pin-s" style="width:30px;height:30px"></div>', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30] }) })
        .addTo(map).bindPopup(`<b>${name}</b><br>${mapEl.dataset.short}`);
      const points = [[+lat, +lng]];
      $$("#parklist li[data-lat]").forEach(li => {
        const p = [+li.dataset.lat, +li.dataset.lng];
        points.push(p);
        L.marker(p, { icon: L.divIcon({ className: "", html: '<div class="pin-p" style="width:26px;height:26px">P</div>', iconSize: [26, 26], iconAnchor: [13, 13] }) })
          .addTo(map).bindPopup(`<b>${li.dataset.name}</b><br>${li.dataset.walk}`);
      });
      map.fitBounds(L.latLngBounds(points).pad(0.25), { animate: false });
      salon.openPopup();
    }
  }
})();
