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
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Catalog filters ---

  function findById(catalogs, id) {
    for (var key in catalogs) {
      var list = catalogs[key];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
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

  // --- DOM builders ---

  function createImage(src, alt, cssClass) {
    var img = document.createElement("img");
    img.className = cssClass + " fade-in";
    img.alt = alt;
    img.setAttribute("fetchpriority", "high");
    img.decoding = "async";
    img.addEventListener("load", function () { img.classList.add("loaded"); });
    img.src = src;
    return img;
  }

  function createActions(meme) {
    var actions = document.createElement("div");
    actions.className = "meme-actions";

    var shuffleBtn = document.createElement("button");
    shuffleBtn.className = "btn";
    shuffleBtn.setAttribute("aria-label", "Cargar otro meme al azar");
    shuffleBtn.textContent = "🔀 Otro meme";
    shuffleBtn.addEventListener("click", function () {
      window.location.href = window.location.pathname;
    });
    actions.appendChild(shuffleBtn);

    var shareUrl = window.location.origin + window.location.pathname + "?id=" + encodeURIComponent(meme.id);

    if (navigator.share) {
      var nativeShareBtn = document.createElement("button");
      nativeShareBtn.className = "btn";
      nativeShareBtn.setAttribute("aria-label", "Compartir este meme");
      nativeShareBtn.textContent = "📤 Compartir";
      nativeShareBtn.addEventListener("click", function () {
        navigator.share({ title: "Memes de Julio", url: shareUrl });
      });
      actions.appendChild(nativeShareBtn);
    }

    var copyBtn = document.createElement("button");
    copyBtn.className = "btn";
    copyBtn.setAttribute("aria-label", "Copiar enlace directo a este meme");
    copyBtn.textContent = "🔗 Copiar link";
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(shareUrl);
      copyBtn.textContent = "✅ Copiado";
      setTimeout(function () { copyBtn.textContent = "🔗 Copiar link"; }, 2000);
    });
    actions.appendChild(copyBtn);

    return actions;
  }

  // --- Animated countdown ---

  function animateNumber(el, target) {
    var duration = 800;
    var start = performance.now();
    var from = Math.min(target + 20, 365);

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

    var dateLabel = document.createElement("p");
    dateLabel.className = "meme-date";
    dateLabel.textContent = formatJulyDate(day, year);
    div.appendChild(dateLabel);

    div.appendChild(createImage("images/" + meme.file, meme.alt, "meme-image"));
    div.appendChild(createActions(meme));

    container.appendChild(div);
  }

  function renderCountdown(container, days, countdownCatalog) {
    var div = document.createElement("div");
    div.className = "countdown-container";

    var available = filterCountdown(countdownCatalog, days);
    if (available.length > 0) {
      div.appendChild(createImage("images/" + pickRandom(available).file, available[0].alt, "countdown-image"));
    } else {
      var emoji = document.createElement("div");
      emoji.className = "countdown-emoji";
      emoji.textContent = "⏳";
      div.appendChild(emoji);
    }

    var number = document.createElement("div");
    number.className = "countdown-number";
    div.appendChild(number);
    animateNumber(number, days);

    var label = document.createElement("div");
    label.className = "countdown-label";
    label.textContent = days === 1 ? "día para julio" : "días para julio";
    div.appendChild(label);

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

    container.appendChild(div);
  }

  // --- Init ---

  function loadCatalogs() {
    return Promise.all([
      fetch("memes.json").then(function (r) { return r.json(); }),
      fetch("countdown.json").then(function (r) { return r.json(); }),
      fetch("specials.json").then(function (r) { return r.json(); })
    ]).then(function (results) {
      return { memes: results[0], countdown: results[1], specials: results[2] };
    });
  }

  function resolveState(catalogs) {
    var now = getEffectiveDate();
    var month = now.getMonth();
    var day = now.getDate();
    var year = now.getFullYear();

    var requestedId = getParams().get("id");
    if (requestedId) {
      var match = findById(catalogs, requestedId);
      if (match) return { type: "meme", meme: match, day: month === JULY ? day : (match.from || 1), year: year };
    }

    var specials = filterSpecials(catalogs.specials, month, day);
    if (specials.length > 0) return { type: "special", special: pickRandom(specials) };

    if (month === JULY) {
      var available = filterMemes(catalogs.memes, day, year);
      if (available.length > 0) return { type: "meme", meme: pickRandom(available), day: day, year: year };
      return { type: "meme", meme: { file: "", alt: "Sin meme para hoy", id: "empty" }, day: day, year: year };
    }

    if (month > JULY) return { type: "see-you" };

    return { type: "countdown", days: daysUntilJuly(now), catalog: catalogs.countdown };
  }

  function render(container, state) {
    container.innerHTML = "";
    switch (state.type) {
      case "meme":      return renderMeme(container, state.meme, state.day, state.year);
      case "special":   return renderSpecial(container, state.special);
      case "countdown": return renderCountdown(container, state.days, state.catalog);
      case "see-you":   return renderSeeYou(container);
    }
  }

  loadCatalogs().then(function (catalogs) {
    var content = document.getElementById("content");
    render(content, resolveState(catalogs));

    enableSwipe(content, function () {
      window.location.href = window.location.pathname;
    });
  });
})();
