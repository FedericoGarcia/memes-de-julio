(function () {
  "use strict";

  var JULY = 6;

  function getEffectiveDate() {
    var params = new URLSearchParams(window.location.search);
    var dateParam = params.get("date");
    if (dateParam) {
      var parsed = new Date(dateParam + "T00:00:00");
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  function getRequestedId() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function daysUntilJuly(now) {
    var year = now.getFullYear();
    var july1 = new Date(year, JULY, 1);
    if (now >= july1) {
      july1 = new Date(year + 1, JULY, 1);
    }
    var diffMs = july1.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  var DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function formatJulyDate(day, year) {
    var weekday = DAYS[new Date(year, JULY, day).getDay()];
    return weekday + ", " + day + " de julio";
  }

  function buildShareUrl(meme) {
    return window.location.origin + window.location.pathname + "?id=" + encodeURIComponent(meme.id);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  function memesForDay(catalog, day, year) {
    return catalog.filter(function (meme) {
      if (day < meme.from || day > meme.to) return false;
      if (meme.weekday !== undefined) {
        var fromWeekday = new Date(year, JULY, meme.from).getDay();
        if (meme.weekday !== fromWeekday) return false;
      }
      return true;
    });
  }

  function findMemeById(catalog, id) {
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].id === id) return catalog[i];
    }
    return null;
  }

  function renderMeme(container, meme, day, year) {
    var div = document.createElement("div");
    div.className = "meme-container";

    var dateLabel = document.createElement("p");
    dateLabel.className = "meme-date";
    dateLabel.textContent = formatJulyDate(day, year);
    div.appendChild(dateLabel);

    var img = document.createElement("img");
    img.className = "meme-image";
    img.src = "images/" + meme.file;
    img.alt = meme.alt;
    img.width = 600;
    img.height = 600;
    img.setAttribute("fetchpriority", "high");
    img.decoding = "async";
    div.appendChild(img);

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

    var shareUrl = buildShareUrl(meme);

    var shareBtn = document.createElement("button");
    shareBtn.className = "btn";
    shareBtn.setAttribute("aria-label", "Copiar enlace directo a este meme");
    shareBtn.textContent = "🔗 Copiar link";
    shareBtn.addEventListener("click", function () {
      copyToClipboard(shareUrl);
      shareBtn.textContent = "✅ Copiado";
      setTimeout(function () {
        shareBtn.textContent = "🔗 Copiar link";
      }, 2000);
    });
    actions.appendChild(shareBtn);

    div.appendChild(actions);
    container.appendChild(div);
  }

  function renderCountdown(container, days) {
    var div = document.createElement("div");
    div.className = "countdown-container";

    var emoji = document.createElement("div");
    emoji.className = "countdown-emoji";
    emoji.textContent = "⏳";
    div.appendChild(emoji);

    var number = document.createElement("div");
    number.className = "countdown-number";
    number.textContent = days;
    div.appendChild(number);

    var label = document.createElement("div");
    label.className = "countdown-label";
    label.textContent = days === 1 ? "día para julio" : "días para julio";
    div.appendChild(label);

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

  function init() {
    var content = document.getElementById("content");

    fetch("memes.json")
      .then(function (res) { return res.json(); })
      .then(function (catalog) {
        content.innerHTML = "";

        var requestedId = getRequestedId();
        if (requestedId) {
          var match = findMemeById(catalog, requestedId);
          if (match) {
            var now = getEffectiveDate();
            renderMeme(content, match, now.getMonth() === JULY ? now.getDate() : match.from, now.getFullYear());
            return;
          }
        }

        var now = getEffectiveDate();
        var month = now.getMonth();
        var day = now.getDate();

        if (month === JULY) {
          var available = memesForDay(catalog, day, now.getFullYear());
          if (available.length > 0) {
            renderMeme(content, pickRandom(available), day, now.getFullYear());
          } else {
            renderMeme(content, { file: "", alt: "Sin meme para hoy", id: "empty", from: day, to: day }, day, now.getFullYear());
          }
        } else if (month > JULY) {
          renderSeeYou(content);
        } else {
          var remaining = daysUntilJuly(now);
          renderCountdown(content, remaining);
        }
      });
  }

  init();
})();
