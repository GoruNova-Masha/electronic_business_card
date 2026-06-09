(function () {
  "use strict";

  const config = window.CARD_CONFIG;
  if (!config) return;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function applyConfig() {
    const { person, services, project, contacts, seo } = config;

    $("person-name").textContent = person.name;
    $("person-title").textContent = person.title;
    $("person-subtitle").textContent = person.subtitle;
    $("person-utp").textContent = person.utp;
    $("footer-name").textContent = person.name;

    $("project-title").textContent = project.title;
    $("project-description").textContent = project.description;

    const botUrl =
      project.telegramUrl ||
      "https://t.me/" + (project.botUsername || "OlisTortiki_Bot") + "?start=vizitka";
    const webUrl =
      project.telegramWebUrl ||
      "https://web.telegram.org/k/#@" + (project.botUsername || "OlisTortiki_Bot");

    $("project-link").href = botUrl;
    if ($("project-link-web")) $("project-link-web").href = webUrl;

    $("contacts-heading").textContent = contacts.heading;
    $("telegram-handle").textContent = contacts.telegram.handle;
    $("contact-telegram").href = contacts.telegram.url;

    $("email-address").textContent = contacts.email.address;
    $("contact-email").href = "mailto:" + contacts.email.address;

    $("phone-display").textContent = contacts.phone.display;
    $("phone-hint").textContent = isMobile ? "Нажмите, чтобы позвонить" : "Нажмите, чтобы скопировать номер";

    const servicesList = $("services-list");
    servicesList.innerHTML = "";
    services.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      servicesList.appendChild(li);
    });

    if (seo.url) {
      $("og-url").setAttribute("content", seo.url);
    }

    document.title = seo.title;
    document.querySelector('meta[name="description"]').setAttribute("content", seo.description);
    document.querySelector('meta[property="og:title"]').setAttribute("content", seo.title);
    document.querySelector('meta[property="og:description"]').setAttribute("content", seo.description);
    document.querySelector('meta[name="twitter:title"]').setAttribute("content", seo.title);
    document.querySelector('meta[name="twitter:description"]').setAttribute("content", seo.description);

    if (seo.url && seo.image) {
      const absImage = new URL(seo.image, seo.url).href;
      document.querySelector('meta[property="og:image"]').setAttribute("content", absImage);
      document.querySelector('meta[name="twitter:image"]').setAttribute("content", absImage);
    }
  }

  function buildVCard() {
    const { person, contacts } = config;
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:" + person.name,
      "TITLE:" + person.title,
      "TEL;TYPE=CELL:" + contacts.phone.raw,
      "EMAIL:" + contacts.email.address,
      "URL:" + contacts.telegram.url,
      "NOTE:" + person.utp,
      "END:VCARD",
    ];
    return lines.join("\r\n");
  }

  function downloadVCard() {
    const blob = new Blob([buildVCard()], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gorunova-maria.vcf";
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("vcard_download");
    showToast("Контакт сохранён");
  }

  function handlePhoneClick() {
    const phone = config.contacts.phone;
    trackEvent("phone");

    if (isMobile) {
      window.location.href = "tel:" + phone.raw;
      return;
    }

    navigator.clipboard.writeText(phone.display).then(
      () => showToast("Номер скопирован: " + phone.display),
      () => showToast(phone.display)
    );
  }

  function getPageUrl() {
    if (config.seo.url) return config.seo.url;
    return window.location.href.split("#")[0];
  }

  let qrCanvas = null;

  function generateQR() {
    const container = $("qr-code");
    const staticImg = $("qr-static");
    const url = getPageUrl();

    if (typeof QRCode === "undefined") {
      if (staticImg) qrCanvas = staticImg;
      return;
    }

    QRCode.toCanvas(
      url,
      {
        width: 200,
        margin: 2,
        color: { dark: "#0A2463", light: "#FFFFFF" },
      },
      (err, canvas) => {
        if (err) {
          if (staticImg) qrCanvas = staticImg;
          return;
        }
        container.innerHTML = "";
        container.appendChild(canvas);
        qrCanvas = canvas;
      }
    );
  }

  function downloadQR() {
    const link = document.createElement("a");
    link.download = "vizitka-qr-maria-gorunova.png";

    if (qrCanvas && qrCanvas.toDataURL) {
      link.href = qrCanvas.toDataURL("image/png");
    } else if (qrCanvas && qrCanvas.src) {
      link.href = qrCanvas.src;
    } else {
      link.href = "assets/vizitka-qr.png";
    }

    link.click();
    trackEvent("qr_download");
  }

  function trackEvent(action) {
    const { yandexMetrikaId, googleAnalyticsId } = config.analytics;

    if (yandexMetrikaId && typeof ym === "function") {
      ym(yandexMetrikaId, "reachGoal", action);
    }

    if (googleAnalyticsId && typeof gtag === "function") {
      gtag("event", action, { event_category: "contact" });
    }
  }

  function initAnalytics() {
    const { yandexMetrikaId, googleAnalyticsId } = config.analytics;

    if (yandexMetrikaId) {
      (function (m, e, t, r, i, k, a) {
        m[i] =
          m[i] ||
          function () {
            (m[i].a = m[i].a || []).push(arguments);
          };
        m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) {
          if (document.scripts[j].src === r) return;
        }
        (k = e.createElement(t)),
          (a = e.getElementsByTagName(t)[0]),
          (k.async = 1),
          (k.src = r),
          a.parentNode.insertBefore(k, a);
      })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym(yandexMetrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    }

    if (googleAnalyticsId) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + googleAnalyticsId;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      gtag("js", new Date());
      gtag("config", googleAnalyticsId);
    }
  }

  function initScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
  }

  function initContactAnalytics() {
    document.querySelectorAll("[data-analytics]").forEach((el) => {
      el.addEventListener("click", () => trackEvent(el.dataset.analytics));
    });
  }

  function init() {
    applyConfig();
    initAnalytics();
    initScrollAnimations();
    initContactAnalytics();

    $("year").textContent = new Date().getFullYear();
    $("save-vcard").addEventListener("click", downloadVCard);
    $("contact-phone").addEventListener("click", handlePhoneClick);
    $("download-qr").addEventListener("click", downloadQR);

    generateQR();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
