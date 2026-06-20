(function () {
  "use strict";

  var JULY = 6;
  var WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  // --- URL & date helpers ---

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getEffectiveDate() {
    var dateParam = getParams().get("date");
    if (dateParam) {
      var parsed = new Date(dateParam + "T00:00:00");
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  function daysUntilJuly(now) {
    var year = now.getFullYear();
    var july1 = new Date(year, JULY, 1);
    if (now >= july1) july1 = new Date(year + 1, JULY, 1);
    return Math.ceil((july1 - now) / (1000 * 60 * 60 * 24));
  }

  function formatJulyDate(day, year) {
    return WEEKDAYS[new Date(year, JULY, day).getDay()] + ", " + day + " de julio";
  }

  function pickRandom(arr) {
    if (arr.length <= 1) return arr[0];
    try {
      var seen = JSON.parse(sessionStorage.getItem("seen") || "[]");
      var unseen = arr.filter(function (m) { return seen.indexOf(m.id) === -1; });
      if (unseen.length === 0) {
        var last = seen[seen.length - 1];
        seen = last ? [last] : [];
        unseen = arr.filter(function (m) { return m.id !== last; });
      }
      var pick = unseen[Math.floor(Math.random() * unseen.length)];
      seen.push(pick.id);
      sessionStorage.setItem("seen", JSON.stringify(seen));
      return pick;
    } catch (e) {
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }

  // --- Catalog filters ---

  function findById(catalogs, id) {
    var keys = ["memes", "countdown", "specials", "generic"];
    for (var k = 0; k < keys.length; k++) {
      var list = catalogs[keys[k]];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return { item: list[i], catalog: keys[k] };
      }
    }
    return null;
  }

  function filterMemes(catalog, day, year) {
    return catalog.filter(function (m) {
      if (day < m.from || day > m.to) return false;
      if (m.weekday !== undefined) {
        if (m.weekday !== new Date(year, JULY, m.from).getDay()) return false;
      }
      return true;
    });
  }

  function filterCountdown(catalog, days) {
    return catalog.filter(function (m) {
      return days >= m.minDays && days <= m.maxDays;
    });
  }

  function filterSpecials(catalog, month, day) {
    return catalog.filter(function (s) {
      return s.month === month + 1 && day >= s.from && day <= s.to;
    });
  }

  // --- Gallery helpers ---

  function formatRangeLabel(meme) {
    if (meme.from === 1 && meme.to === 31) return "Todo julio";
    if (meme.from === meme.to) return meme.from + " de julio";
    return meme.from + " al " + meme.to + " de julio";
  }

  function groupMemes(catalog) {
    var map = {};
    catalog.forEach(function (meme) {
      var label = formatRangeLabel(meme);
      var sortKey = (meme.from === 1 && meme.to === 31) ? 99999 : meme.from * 100 + meme.to;
      if (!map[label]) map[label] = { label: label, memes: [], sortKey: sortKey };
      map[label].memes.push(meme);
    });

    var groups = [];
    for (var key in map) groups.push(map[key]);
    groups.sort(function (a, b) { return a.sortKey - b.sortKey; });
    return groups;
  }

  function createGalleryItem(item) {
    var link = document.createElement("a");
    link.href = "?id=" + encodeURIComponent(item.id) + "&from=galeria";
    link.className = "gallery-item";

    var img = document.createElement("img");
    img.src = "images/" + item.file;
    img.alt = item.alt;
    img.loading = "lazy";
    img.className = "gallery-thumb fade-in";
    img.addEventListener("load", function () { img.classList.add("loaded"); });

    link.appendChild(img);
    return link;
  }

  // --- DOM builders ---

  function createImage(src, alt, cssClass) {
    var img = document.createElement("img");
    img.className = cssClass + " fade-in";
    img.alt = alt;
    img.setAttribute("fetchpriority", "high");
    img.decoding = "async";
    img.addEventListener("load", function () { img.classList.add("loaded"); });
    img.addEventListener("click", function () { openLightbox(src, alt); });
    img.src = src;
    return img;
  }

  function openLightbox(src, alt) {
    var overlay = document.createElement("div");
    overlay.className = "lightbox active";
    var img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    overlay.appendChild(img);
    overlay.addEventListener("click", function () { overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function shuffleUrl() {
    var dateParam = getParams().get("date");
    if (dateParam) return window.location.pathname + "?date=" + encodeURIComponent(dateParam);
    return window.location.pathname;
  }

  function createShuffleBtn() {
    var btn = document.createElement("button");
    btn.className = "btn";
    btn.setAttribute("aria-label", "Cargar otra imagen al azar");
    btn.textContent = "🔀 Otra imagen";
    btn.addEventListener("click", function () {
      window.location.href = shuffleUrl();
    });
    return btn;
  }

  function createShareBtns(url, title) {
    var fragment = document.createDocumentFragment();

    if (navigator.share) {
      var nativeBtn = document.createElement("button");
      nativeBtn.className = "btn";
      nativeBtn.setAttribute("aria-label", "Compartir");
      nativeBtn.textContent = "📤 Compartir";
      nativeBtn.addEventListener("click", function () {
        navigator.share({ title: title, url: url });
      });
      fragment.appendChild(nativeBtn);
    }

    var copyBtn = document.createElement("button");
    copyBtn.className = "btn";
    copyBtn.setAttribute("aria-label", "Copiar enlace");
    copyBtn.textContent = "🔗 Copiar link";
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      copyBtn.textContent = "✅ Copiado";
      setTimeout(function () { copyBtn.textContent = "🔗 Copiar link"; }, 2000);
    });
    fragment.appendChild(copyBtn);

    return fragment;
  }

  function createActions(meme, title) {
    var actions = document.createElement("div");
    actions.className = "meme-actions";
    var shareUrl = window.location.origin + window.location.pathname + "?id=" + encodeURIComponent(meme.id);
    actions.appendChild(createShuffleBtn());
    actions.appendChild(createShareBtns(shareUrl, title || "Memes de Julio"));
    return actions;
  }

  // --- Animated countdown ---

  function animateNumber(el, target) {
    try {
      if (sessionStorage.getItem("countdownAnimated")) {
        el.textContent = target;
        return;
      }
      sessionStorage.setItem("countdownAnimated", "1");
    } catch (e) { /* fallback: animate */ }

    var duration = 800;
    var start = performance.now();
    var year = getEffectiveDate().getFullYear();
    var from = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;

    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // --- Swipe support ---

  function enableSwipe(container, onSwipe) {
    var startX = 0;
    var startY = 0;
    var threshold = 50;

    container.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? "right" : "left");
      }
    }, { passive: true });
  }

  // --- Renderers ---

  function renderMeme(container, meme, day, year) {
    var div = document.createElement("div");
    div.className = "meme-container";

    if (day !== null) {
      var dateLabel = document.createElement("p");
      dateLabel.className = "meme-date";
      dateLabel.textContent = formatJulyDate(day, year);
      div.appendChild(dateLabel);
    }

    div.appendChild(createImage("images/" + meme.file, meme.alt, "meme-image"));
    div.appendChild(createActions(meme));

    container.appendChild(div);
  }

  function renderCountdown(container, days, countdownCatalog) {
    var div = document.createElement("div");
    div.className = "countdown-container";

    var available = filterCountdown(countdownCatalog, days);
    var picked = available.length > 0 ? pickRandom(available) : null;
    if (picked) {
      div.appendChild(createImage("images/" + picked.file, picked.alt, "countdown-image"));
    } else {
      var emoji = document.createElement("div");
      emoji.className = "countdown-emoji";
      emoji.textContent = "⏳";
      div.appendChild(emoji);
    }

    var info = document.createElement("div");
    info.className = "countdown-info";

    var number = document.createElement("div");
    number.className = "countdown-number";
    info.appendChild(number);
    animateNumber(number, days);

    var label = document.createElement("div");
    label.className = "countdown-label";
    label.textContent = days === 1 ? "día para julio" : "días para julio";
    info.appendChild(label);

    if (picked) {
      info.appendChild(createActions(picked, "Memes de Julio — ¿cuánto falta?"));
    }

    div.appendChild(info);
    container.appendChild(div);
  }

  function renderSpecial(container, special) {
    var div = document.createElement("div");
    div.className = "meme-container";

    div.appendChild(createImage("images/" + special.file, special.alt, "meme-image"));

    if (special.caption) {
      var caption = document.createElement("p");
      caption.className = "meme-date";
      caption.textContent = special.caption;
      div.appendChild(caption);
    }

    div.appendChild(createActions(special));
    container.appendChild(div);
  }

  function renderGalleryDetail(container, item, catalog) {
    var div = document.createElement("div");
    div.className = "meme-container";

    if (catalog === "memes") {
      var rangeLabel = document.createElement("p");
      rangeLabel.className = "meme-date";
      rangeLabel.textContent = formatRangeLabel(item);
      div.appendChild(rangeLabel);
    }

    div.appendChild(createImage("images/" + item.file, item.alt, "meme-image"));

    if (item.caption) {
      var caption = document.createElement("p");
      caption.className = "meme-date";
      caption.textContent = item.caption;
      div.appendChild(caption);
    }

    var actions = document.createElement("div");
    actions.className = "meme-actions";
    var shareUrl = window.location.origin + window.location.pathname + "?id=" + encodeURIComponent(item.id);
    actions.appendChild(createShareBtns(shareUrl, "Memes de Julio"));

    var backBtn = document.createElement("a");
    backBtn.className = "btn";
    backBtn.href = "?view=galeria";
    backBtn.textContent = "← Galería";
    actions.appendChild(backBtn);

    div.appendChild(actions);
    container.appendChild(div);
  }

  function renderGalleryGrid(parent, items) {
    var grid = document.createElement("div");
    grid.className = "gallery-grid";
    items.forEach(function (item) { grid.appendChild(createGalleryItem(item)); });
    parent.appendChild(grid);
  }

  function renderGallery(container, catalogs) {
    document.title = "Galería | Memes de Julio Iglesias";
    container.classList.add("gallery-mode");

    var div = document.createElement("div");
    div.className = "gallery-container";

    var julyHeading = document.createElement("h2");
    julyHeading.className = "gallery-section-title";
    julyHeading.textContent = "Memes de Julio";
    div.appendChild(julyHeading);

    groupMemes(catalogs.memes).forEach(function (group) {
      var sub = document.createElement("h3");
      sub.className = "gallery-subsection-title";
      sub.textContent = group.label;
      div.appendChild(sub);
      renderGalleryGrid(div, group.memes);
    });

    if (catalogs.countdown.length > 0) {
      var countdownHeading = document.createElement("h2");
      countdownHeading.className = "gallery-section-title";
      countdownHeading.textContent = "Cuenta regresiva";
      div.appendChild(countdownHeading);
      renderGalleryGrid(div, catalogs.countdown);
    }

    if (catalogs.generic.length > 0) {
      var genericHeading = document.createElement("h2");
      genericHeading.className = "gallery-section-title";
      genericHeading.textContent = "Genéricos";
      div.appendChild(genericHeading);
      renderGalleryGrid(div, catalogs.generic);
    }

    if (catalogs.specials.length > 0) {
      var specialsHeading = document.createElement("h2");
      specialsHeading.className = "gallery-section-title";
      specialsHeading.textContent = "Especiales";
      div.appendChild(specialsHeading);
      renderGalleryGrid(div, catalogs.specials);
    }

    container.appendChild(div);
  }

  function renderSeeYou(container) {
    var div = document.createElement("div");
    div.className = "see-you-container";

    var emoji = document.createElement("div");
    emoji.className = "see-you-emoji";
    emoji.textContent = "👋";
    div.appendChild(emoji);

    var text = document.createElement("div");
    text.className = "see-you-text";
    text.textContent = "Nos vemos el año que viene";
    div.appendChild(text);

    var actions = document.createElement("div");
    actions.className = "meme-actions";

    var now = getEffectiveDate();
    var exploreUrl = window.location.pathname + "?date=" + now.getFullYear() + "-07-01";
    var exploreBtn = document.createElement("a");
    exploreBtn.className = "btn";
    exploreBtn.href = exploreUrl;
    exploreBtn.textContent = "📅 Ver memes de julio";
    actions.appendChild(exploreBtn);

    var shareUrl = window.location.origin + window.location.pathname;
    actions.appendChild(createShareBtns(shareUrl, "Memes de Julio — nos vemos el año que viene"));
    div.appendChild(actions);

    container.appendChild(div);
  }

  // --- Init ---

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) return [];
      return r.json();
    });
  }

  function loadCatalogs() {
    return Promise.all([
      fetchJSON("memes.json"),
      fetchJSON("countdown.json"),
      fetchJSON("specials.json"),
      fetchJSON("generic.json")
    ]).then(function (results) {
      return { memes: results[0], countdown: results[1], specials: results[2], generic: results[3] };
    });
  }

  function resolveState(catalogs) {
    var now = getEffectiveDate();
    var month = now.getMonth();
    var day = now.getDate();
    var year = now.getFullYear();

    var requestedId = getParams().get("id");
    if (requestedId) {
      var result = findById(catalogs, requestedId);
      if (result) {
        if (getParams().get("from") === "galeria") {
          return { type: "gallery-detail", item: result.item, catalog: result.catalog };
        }
        if (result.catalog === "specials") return { type: "special", special: result.item };
        return { type: "meme", meme: result.item, day: null, year: year };
      }
    }

    if (getParams().get("view") === "galeria") {
      return { type: "gallery", catalogs: catalogs };
    }

    var specials = filterSpecials(catalogs.specials, month, day);
    if (specials.length > 0) return { type: "special", special: pickRandom(specials) };

    if (month === JULY) {
      var available = filterMemes(catalogs.memes, day, year);
      if (available.length > 0) return { type: "meme", meme: pickRandom(available), day: day, year: year };
      return { type: "meme", meme: { file: "", alt: "Sin meme para hoy", id: "empty" }, day: day, year: year };
    }

    return { type: "countdown", days: daysUntilJuly(now), catalog: catalogs.countdown };
  }

  function render(container, state) {
    container.innerHTML = "";
    switch (state.type) {
      case "meme":           return renderMeme(container, state.meme, state.day, state.year);
      case "special":        return renderSpecial(container, state.special);
      case "countdown":      return renderCountdown(container, state.days, state.catalog);
      case "see-you":        return renderSeeYou(container);
      case "gallery":        return renderGallery(container, state.catalogs);
      case "gallery-detail": return renderGalleryDetail(container, state.item, state.catalog);
    }
  }

  function openSuggestModal() {
    var overlay = document.createElement("div");
    overlay.className = "suggest-modal active";

    var card = document.createElement("div");
    card.className = "suggest-card";

    var img = document.createElement("img");
    img.src = "images/memes-con-nivel.webp";
    img.alt = "Julio Iglesias sosteniendo un nivel de albañil. Texto: Si van a subir memes de julio que sea con nivel";
    img.className = "suggest-image";
    card.appendChild(img);

    var link = document.createElement("a");
    link.href = "mailto:memes@memesdejulio.com.ar";
    link.className = "btn suggest-email-btn";
    link.textContent = "📧 memes@memesdejulio.com.ar";
    card.appendChild(link);

    var closeBtn = document.createElement("button");
    closeBtn.className = "suggest-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", function () { overlay.remove(); });
    card.appendChild(closeBtn);

    overlay.appendChild(card);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  var suggestBtn = document.getElementById("suggest-btn");
  if (suggestBtn) suggestBtn.addEventListener("click", openSuggestModal);

  loadCatalogs().then(function (catalogs) {
    var content = document.getElementById("content");
    var state = resolveState(catalogs);
    render(content, state);

    if (state.type !== "gallery") {
      enableSwipe(content, function () {
        window.location.href = shuffleUrl();
      });
    }
  });
})();
