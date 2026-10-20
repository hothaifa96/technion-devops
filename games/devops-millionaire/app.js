(function () {
  const $ = (id) => document.getElementById(id);
  const LETTERS = ["A", "B", "C", "D"];
  const PRIZES = [
    100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000,
    250000, 500000, 1000000,
  ];
  const SAFE = [4, 9]; // indexes of level 5 and 10
  const tierOf = (level) => (level < 5 ? 1 : level < 10 ? 2 : 3);
  const TOPIC_LABELS = {
    docker: "Docker",
    kubernetes: "Kubernetes",
    helm: "Helm",
    jenkins: "Jenkins",
    observability: "Prometheus & Grafana",
  };
  const SCORES_KEY = "devops-millionaire-scores-v1";

  let pools = {};
  let level = 0;
  let current = null;
  let selected = -1;
  let locked = false;
  let lifelines = {};
  let seconds = 60;
  let timeLeft = 0;
  let timerHandle = null;
  let player = "TEAM A";
  let history = [];
  let pendingEnd = null; // set after a wrong answer: { title, won }

  const fmt = (n) => n.toLocaleString("en-US");
  const shuffle = (a) =>
    a
      .map((v) => [Math.random(), v])
      .sort((x, y) => x[0] - y[0])
      .map((x) => x[1]);

  // escape HTML, then render `code` spans
  function rich(text) {
    const esc = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc.replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  // ---------- ladder ----------
  function renderLadder() {
    const el = $("ladder");
    el.innerHTML = "";
    const playing = !$("game").classList.contains("hidden");
    // the ladder uses column-reverse: a tier head appended after levels 5/10/15 shows up above its tier
    PRIZES.forEach((p, i) => {
      const r = document.createElement("div");
      r.className =
        "rung" +
        (SAFE.includes(i) || i === 14 ? " safe" : "") +
        (i < level ? " done" : "") +
        (i === level && playing ? " current" : "");
      r.innerHTML = `<span class="lvl">${i + 1}</span><span>${fmt(p)}</span>`;
      el.appendChild(r);
      if (i === 4 || i === 9 || i === 14) {
        const h = document.createElement("div");
        h.className = "rung tier-head";
        h.textContent =
          i === 4 ? "-- hard --" : i === 9 ? "-- very hard --" : "-- expert --";
        el.appendChild(h);
      }
    });
  }

  // ---------- setup ----------
  function renderHighscores() {
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    if (!scores.length) return ($("highscores").innerHTML = "");
    $("highscores").innerHTML =
      "<h2>&gt; hall of fame</h2><table><tr><th>#</th><th>contestant</th><th>won</th><th>correct</th></tr>" +
      scores
        .slice(0, 8)
        .map(
          (s, i) =>
            `<tr><td>${i + 1}</td><td>${rich(s.name)}</td><td>${fmt(s.won)}</td><td>${s.level}</td></tr>`,
        )
        .join("") +
      "</table>";
  }

  $("btnStart").addEventListener("click", () => {
    const topic = $("topicSel").value;
    const bank = MILLIONAIRE.filter(
      (q) => topic === "all" || q.topic === topic,
    );
    pools = {
      1: shuffle(bank.filter((q) => q.tier === 1)),
      2: shuffle(bank.filter((q) => q.tier === 2)),
      3: shuffle(bank.filter((q) => q.tier === 3)),
    };
    // single-topic mode: top up each tier (5 levels + 1 swap) with same-tier questions from other topics
    [1, 2, 3].forEach((t) => {
      const others = shuffle(
        MILLIONAIRE.filter((q) => q.tier === t && !pools[t].includes(q)),
      );
      while (pools[t].length < 6 && others.length)
        pools[t].push(others.shift());
    });
    seconds = Number($("timerSel").value);
    player = $("playerName").value.trim() || "TEAM A";
    level = 0;
    history = [];
    lifelines = { fifty: true, hint: true, swap: true };
    ["ll5050", "llHint", "llSwap"].forEach((id) => ($(id).disabled = false));
    $("setup").classList.add("hidden");
    $("results").classList.add("hidden");
    $("game").classList.remove("hidden");
    loadQuestion();
  });

  // ---------- question flow ----------
  function drawQuestion() {
    const pool = pools[tierOf(level)];
    return pool.length ? pool.shift() : null;
  }

  function loadQuestion(replacement) {
    current = replacement || drawQuestion();
    if (!current) return endGame("out of questions", PRIZES[level - 1] || 0);
    current._order = shuffle([0, 1, 2, 3]);
    selected = -1;
    locked = false;
    $("levelPill").textContent = `level ${level + 1} / 15`;
    $("topicPill").textContent = TOPIC_LABELS[current.topic] || current.topic;
    $("forPill").textContent = fmt(PRIZES[level]);
    $("question").innerHTML = rich(current.q);
    $("hintBox").classList.add("hidden");
    $("explain").classList.add("hidden");
    $("btnFinal").classList.add("hidden");
    $("btnNext").classList.add("hidden");
    $("btnWalk").disabled = false;
    $("choices").innerHTML = "";
    current._order.forEach((orig, pos) => {
      const b = document.createElement("button");
      b.className = "mil-choice";
      b.innerHTML = `<span class="letter">${LETTERS[pos]}:</span>${rich(current.choices[orig])}`;
      b.addEventListener("click", () => select(pos));
      $("choices").appendChild(b);
    });
    renderLadder();
    startTimer();
  }

  function startTimer() {
    clearInterval(timerHandle);
    const show = seconds > 0;
    $("timer").classList.toggle("hidden", !show);
    $("clockPill").classList.toggle("hidden", !show);
    if (!show) return;
    timeLeft = seconds;
    const tick = () => {
      const pct = (timeLeft / seconds) * 100;
      $("timer").firstElementChild.style.width = pct + "%";
      $("timer").classList.toggle("warn", pct <= 50 && pct > 20);
      $("timer").classList.toggle("danger", pct <= 20);
      $("clock").textContent = Math.ceil(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        reveal(-1);
      }
      timeLeft -= 0.25;
    };
    tick();
    timerHandle = setInterval(tick, 250);
  }

  function choiceButtons() {
    return [...$("choices").children];
  }

  function select(pos) {
    if (locked) return;
    const btn = choiceButtons()[pos];
    if (!btn || btn.classList.contains("removed")) return;
    selected = pos;
    choiceButtons().forEach((b, i) =>
      b.classList.toggle("selected", i === pos),
    );
    $("btnFinal").classList.remove("hidden");
    $("btnFinal").textContent = `final answer: ${LETTERS[pos]}?`;
  }

  function reveal(pos) {
    if (locked) return;
    locked = true;
    clearInterval(timerHandle);
    $("btnFinal").classList.add("hidden");
    $("btnWalk").disabled = true;
    const correctPos = current._order.indexOf(current.a);
    const right = pos === correctPos;
    // a little suspense before the reveal
    setTimeout(() => {
      choiceButtons().forEach((b, i) => {
        b.disabled = true;
        b.classList.remove("selected");
        if (i === correctPos) b.classList.add("correct");
        else if (i === pos) b.classList.add("wrong");
      });
      history.push({ q: current, right, level: level + 1 });
      $("explain").innerHTML =
        (pos === -1
          ? "<b>time's up!</b> "
          : right
            ? "<b>correct!</b> "
            : "<b>wrong.</b> ") + rich(current.explain);
      $("explain").classList.remove("hidden");
      if (right) {
        level++;
        renderLadder();
        if (level === PRIZES.length)
          return setTimeout(() => endGame("MILLIONAIRE!", PRIZES[14]), 1200);
        $("btnNext").classList.remove("hidden");
        $("btnNext").textContent = SAFE.includes(level - 1)
          ? `safe haven reached (${fmt(PRIZES[level - 1])}) - next >>`
          : "next question >>";
        $("btnNext").focus();
      } else {
        const safe = SAFE.filter((s) => s < level).pop();
        const won = safe === undefined ? 0 : PRIZES[safe];
        $("btnNext").classList.remove("hidden");
        $("btnNext").textContent = "see results >>";
        pendingEnd = { title: "game over", won };
      }
    }, 1200);
  }

  $("btnFinal").addEventListener(
    "click",
    () => selected !== -1 && reveal(selected),
  );
  $("btnNext").addEventListener("click", () => {
    if (pendingEnd) return endGame(pendingEnd.title, pendingEnd.won);
    loadQuestion();
  });

  // ---------- lifelines ----------
  $("ll5050").addEventListener("click", () => {
    if (!lifelines.fifty || locked) return;
    lifelines.fifty = false;
    $("ll5050").disabled = true;
    const correctPos = current._order.indexOf(current.a);
    const wrong = shuffle([0, 1, 2, 3].filter((i) => i !== correctPos)).slice(
      0,
      2,
    );
    wrong.forEach((i) => {
      const b = choiceButtons()[i];
      b.classList.add("removed");
      b.classList.remove("selected");
      if (selected === i) {
        selected = -1;
        $("btnFinal").classList.add("hidden");
      }
    });
  });

  $("llHint").addEventListener("click", () => {
    if (!lifelines.hint || locked) return;
    lifelines.hint = false;
    $("llHint").disabled = true;
    $("hintBox").innerHTML = `<b>senior engineer:</b> "${rich(current.hint)}"`;
    $("hintBox").classList.remove("hidden");
  });

  $("llSwap").addEventListener("click", () => {
    if (!lifelines.swap || locked) return;
    const next = drawQuestion();
    if (!next) return;
    lifelines.swap = false;
    $("llSwap").disabled = true;
    loadQuestion(next);
  });

  $("btnWalk").addEventListener("click", () => {
    if (locked) return;
    const won = level === 0 ? 0 : PRIZES[level - 1];
    if (confirm(`Walk away with ${fmt(won)}?`)) {
      clearInterval(timerHandle);
      endGame("walked away", won);
    }
  });

  // ---------- end ----------
  function endGame(title, won) {
    clearInterval(timerHandle);
    pendingEnd = null;
    $("game").classList.add("hidden");
    $("results").classList.remove("hidden");
    $("resultTitle").textContent = `> ${title}`;
    const correct = history.filter((h) => h.right).length;
    $("resultText").innerHTML =
      `${rich(player)} leaves with <b style="color:var(--amber)">${fmt(won)}</b> points (${correct}/15 answered correctly).`;
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    scores.push({ name: player, won, level: correct });
    scores.sort((a, b) => b.won - a.won);
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 20)));
    $("review").innerHTML =
      "<p class='muted'>debrief - discuss these with the class:</p>";
    history.forEach((h) => {
      const div = document.createElement("div");
      div.className = "explain";
      div.innerHTML = `<b>${h.right ? "[OK]" : "[X]"} level ${h.level}</b> - ${rich(h.q.q)}<br/><span class="muted">answer:</span> ${rich(h.q.choices[h.q.a])}<br/><span class="muted">${rich(h.q.explain)}</span>`;
      $("review").appendChild(div);
    });
  }

  $("btnAgain").addEventListener("click", () => {
    $("results").classList.add("hidden");
    $("setup").classList.remove("hidden");
    renderHighscores();
  });

  // ---------- keyboard ----------
  document.addEventListener("keydown", (e) => {
    if ($("game").classList.contains("hidden") || e.target.tagName === "INPUT")
      return;
    const k = LETTERS.indexOf(e.key.toUpperCase());
    if (k !== -1) return select(k);
    if (e.key === "Enter") {
      e.preventDefault();
      if (!locked && selected !== -1) reveal(selected);
      else if (!$("btnNext").classList.contains("hidden")) $("btnNext").click();
    }
  });

  $("btnFullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  renderLadder();
  renderHighscores();
})();
