/*  AGATEX – Web-Analytics
 *  Google Analytics 4 (Consent-Mode v2 – lädt ERST nach Zustimmung)
 *  + Cloudflare Web Analytics (cookielos, keine Zustimmung nötig)
 *
 *  ┌───────────────────────────────────────────────────────────────────────┐
 *  │  NUR DIESE ZWEI ZEILEN PRO WEBSITE ANPASSEN:                           │
 *  │  • GA_MEASUREMENT_ID: die GA4 Mess-ID dieser Website (Format G-XXXX).  │
 *  │    Solange sie leer ist, wird GA NICHT geladen und KEIN Banner gezeigt.│
 *  │  • CF_BEACON_TOKEN: Cloudflare-Web-Analytics-Token. Leer lassen, wenn  │
 *  │    im Cloudflare-Dashboard "Automatic Setup" aktiv ist (bei proxied    │
 *  │    Domains injiziert Cloudflare das Beacon dann selbst am Edge).        │
 *  └───────────────────────────────────────────────────────────────────────┘ */
(function () {
  "use strict";

  var GA_MEASUREMENT_ID = "";   // AGATEX Kältemittel
  var CF_BEACON_TOKEN   = "";   // ← optional, z. B. "0123ab...": leer = Auto-Setup im CF-Dashboard

  /* ───────────────────────────  ab hier nichts ändern  ─────────────────── */

  var STORAGE_KEY = "agatex-consent";                 // "granted" | "denied"
  var GA_ACTIVE   = /^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID);

  // ---- Google Consent Mode v2: standardmäßig ALLES verweigert ----
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });

  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded || !GA_ACTIVE) return;
    gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function setConsent(granted) {
    try { localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied"); } catch (e) {}
    if (granted) {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted"
      });
      loadGA();
    }
  }

  // ---- Cloudflare Web Analytics: cookielos → keine Zustimmung erforderlich ----
  if (CF_BEACON_TOKEN) {
    var cf = document.createElement("script");
    cf.defer = true;
    cf.src = "https://static.cloudflareinsights.com/beacon.min.js";
    cf.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
    (document.head || document.body).appendChild(cf);
  }

  // ---- Frühere Entscheidung anwenden ----
  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (stored === "granted") setConsent(true);

  // ---- Dreisprachiger Consent-Banner (DE/EN/ZH gemäß ?lang=) ----
  var T = {
    de: { txt: "Wir setzen Google Analytics ein, um die Nutzung dieser Website zu verstehen und zu verbessern – dabei werden Cookies gesetzt. Eine anonyme, cookielose Reichweitenmessung (Cloudflare) läuft unabhängig davon. Sie entscheiden.",
          ok: "Akzeptieren", no: "Ablehnen", more: "Datenschutz" },
    en: { txt: "We use Google Analytics to understand and improve how this website is used – this sets cookies. Anonymous, cookieless traffic measurement (Cloudflare) runs regardless. It's your choice.",
          ok: "Accept", no: "Decline", more: "Privacy" },
    zh: { txt: "我们使用 Google Analytics 来了解并改进本网站的使用情况，这会设置 Cookie。匿名、无 Cookie 的访问量统计（Cloudflare）将始终运行。由您决定。",
          ok: "接受", no: "拒绝", more: "隐私政策" }
  };
  function lang() {
    var m = /[?&]lang=(de|en|zh)/i.exec(location.search);
    return m ? m[1].toLowerCase() : "de";
  }

  function buildBanner() {
    if (document.getElementById("agx-consent")) return;
    var t = T[lang()] || T.de;
    var style = document.createElement("style");
    style.textContent =
      "#agx-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:760px;margin:0 auto;" +
      "background:#fff;color:#1A3257;border:1px solid rgba(26,50,87,.14);border-radius:14px;" +
      "box-shadow:0 8px 40px rgba(26,50,87,.18);padding:18px 20px;font-family:'Inter',system-ui,sans-serif;" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:14px;font-size:.86rem;line-height:1.55}" +
      "#agx-consent p{margin:0;flex:1 1 300px;color:#546e7a}" +
      "#agx-consent a{color:#0D8E52;font-weight:600}" +
      "#agx-consent .agx-btns{display:flex;gap:10px;flex-wrap:wrap}" +
      "#agx-consent button{cursor:pointer;border-radius:9px;padding:9px 18px;font:600 .84rem/1 'Inter',sans-serif;border:1px solid transparent}" +
      "#agx-consent .agx-no{background:#fff;border-color:rgba(26,50,87,.2);color:#546e7a}" +
      "#agx-consent .agx-ok{background:linear-gradient(135deg,#0D8E52,#1A3257);color:#fff}" +
      "@media(max-width:560px){#agx-consent .agx-btns{width:100%}#agx-consent button{flex:1}}";
    document.head.appendChild(style);

    var box = document.createElement("div");
    box.id = "agx-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Cookie-Einstellungen");
    box.innerHTML =
      '<p>' + t.txt + ' <a href="datenschutz.html">' + t.more + '</a></p>' +
      '<div class="agx-btns">' +
      '<button class="agx-no" type="button">' + t.no + '</button>' +
      '<button class="agx-ok" type="button">' + t.ok + '</button>' +
      '</div>';
    document.body.appendChild(box);
    box.querySelector(".agx-ok").addEventListener("click", function () { setConsent(true); box.remove(); });
    box.querySelector(".agx-no").addEventListener("click", function () { setConsent(false); box.remove(); });
  }

  function maybeBanner() {
    if (!GA_ACTIVE) return;                              // ohne GA-ID keinen Banner zeigen
    if (stored === "granted" || stored === "denied") return;
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", buildBanner);
    else buildBanner();
  }
  maybeBanner();

  // Banner erneut öffnen – z. B. Link "Cookie-Einstellungen ändern" in der Datenschutzerklärung
  window.agatexOpenConsent = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    stored = null;
    var ex = document.getElementById("agx-consent"); if (ex) ex.remove();
    buildBanner();
  };
})();
