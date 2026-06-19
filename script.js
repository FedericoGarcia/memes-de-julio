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

  function formatJulyDate(day) {
    return day + " de julio";
  }

  function buildShareUrl(meme) {
    return window.location.origin + window.location.pathname + "?id=" + encodeURIComponent(meme.id);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  function renderMeme(container, meme, day) {
    var div = document.createElement("div");
    div.className = "meme-container";

    var dateLabel = document.createElement("p");
    dateLabel.className = "meme-date";
    dateLabel.textContent = formatJulyDate(day);
    div.appendChild(dateLabel);

    var img = document.createElement("img");
    img.className = "meme-image";
    img.src = "images/" + meme.file;
    img.alt = meme.alt;
    img.loading = "eager";
    img.width = 600;
    img.height = 600;
    div.appendChild(img);

    var actions = document.createElement("div");
    actions.className = "meme-actions";

    var shuffleBtn = document.createElement("button");
    shuffleBtn.className = "btn";
    shuffleBtn.textContent = "🔀 Otro meme";
    shuffleBtn.addEventListener("click", function () {
      window.location.href = window.location.pathname;
    });
    actions.appendChild(shuffleBtn);

    var shareUrl = buildShareUrl(meme);

    var shareBtn = document.createElement("button");
    shareBtn.className = "btn";
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

  function findMemeById(catalog, id) {
    var days = Object.keys(catalog);
    for (var i = 0; i < days.length; i++) {
      var memes = catalog[days[i]];
      for (var j = 0; j < memes.length; j++) {
        if (memes[j].id === id) {
          return { meme: memes[j], day: parseInt(days[i], 10) };
        }
      }
    }
    return null;
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
            renderMeme(content, match.meme, match.day);
            return;
          }
        }

        var now = getEffectiveDate();
        var month = now.getMonth();
        var day = now.getDate();

        if (month === JULY) {
          var dayKey = String(day);
          var memes = catalog[dayKey];
          if (memes && memes.length > 0) {
            var meme = pickRandom(memes);
            renderMeme(content, meme, day);
          } else {
            renderMeme(content, { file: "", alt: "Sin meme para hoy", id: "empty" }, day);
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
