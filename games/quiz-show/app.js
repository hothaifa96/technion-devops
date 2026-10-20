(function () {
  const $ = (id) => document.getElementById(id);
  const TOPIC_LABELS = {
    docker: "Docker",
    kubernetes: "Kubernetes",
    helm: "Helm",
    jenkins: "Jenkins",
    observability: "Prometheus & Grafana",
  };
  const KEYS = ["1", "2", "3", "4"];

  let round = [];
  let idx = 0;
  let scores = { A: 0, B: 0 };
  let mode = "solo";
  let seconds = 20;
  let timerHandle = null;
  let timeLeft = 0;
  let answered = false;
  let missed = [];

  // ---------- setup ----------
  Object.keys(QUIZ).forEach((t) => {
    const label = document.createElement("label");
    label.className = "pill";
    label.innerHTML = `<input type="checkbox" value="${t}" checked /> ${TOPIC_LABELS[t] || t} (${QUIZ[t].length})`;
    $("topicBoxes").appendChild(label);
  });

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  $("btnStart").addEventListener("click", () => {
    const topics = [
      ...document.querySelectorAll("#topicBoxes input:checked"),
    ].map((i) => i.value);
    if (!topics.length) return alert("pick at least one topic");
    const pool = topics.flatMap((t) =>
      QUIZ[t].map((q) => ({ ...q, topic: t })),
    );
    round = shuffle(pool).slice(0, Number($("numQ").value));
    seconds = Number($("secs").value);
    mode = $("mode").value;
    scores = { A: 0, B: 0 };
    missed = [];
    idx = 0;
    $("turnPill").classList.toggle("hidden", mode === "solo");
    $("setup").classList.add("hidden");
    $("results").classList.add("hidden");
    $("game").classList.remove("hidden");
    showQuestion();
  });

  // ---------- game ----------
  const currentTeam = () => (mode === "teams" && idx % 2 === 1 ? "B" : "A");

  function showQuestion() {
    answered = false;
    const item = round[idx];
    // shuffle choices but remember the correct one
    const order = shuffle(item.choices.map((c, i) => i));
    item._order = order;
    $("progress").textContent = `Q ${idx + 1}/${round.length}`;
    $("topicPill").textContent = TOPIC_LABELS[item.topic] || item.topic;
    $("turnPill").innerHTML = `turn: <strong>TEAM ${currentTeam()}</strong>`;
    $("question").textContent = item.q;
    $("explain").classList.add("hidden");
    $("btnNext").classList.add("hidden");
    $("choices").innerHTML = "";
    order.forEach((origIdx, pos) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.innerHTML = `<span class="key">${KEYS[pos]}</span>`;
      btn.appendChild(document.createTextNode(item.choices[origIdx]));
      btn.addEventListener("click", () => answer(pos));
      $("choices").appendChild(btn);
    });
    startTimer();
  }

  function startTimer() {
    clearInterval(timerHandle);
    const bar = $("timer");
    bar.classList.toggle("hidden", seconds === 0);
    if (!seconds) return;
    timeLeft = seconds;
    const tick = () => {
      const pct = (timeLeft / seconds) * 100;
      bar.firstElementChild.style.width = pct + "%";
      bar.classList.toggle("warn", pct <= 50 && pct > 25);
      bar.classList.toggle("danger", pct <= 25);
      if (timeLeft <= 0) {
        clearInterval(timerHandle);
        answer(-1);
      }
      timeLeft -= 0.25;
    };
    tick();
    timerHandle = setInterval(tick, 250);
  }

  function answer(pos) {
    if (answered) return;
    answered = true;
    clearInterval(timerHandle);
    const item = round[idx];
    const correctPos = item._order.indexOf(item.a);
    const buttons = [...$("choices").children];
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === correctPos) b.classList.add("correct");
      else if (i === pos) b.classList.add("wrong");
    });
    if (pos === correctPos) {
      // faster answers earn more points: 100 base + up to 100 bonus
      const bonus = seconds
        ? Math.round((Math.max(timeLeft, 0) / seconds) * 100)
        : 0;
      scores[currentTeam()] += 100 + bonus;
    } else {
      missed.push(item);
    }
    $("scoreA").textContent = scores.A;
    $("scoreB").textContent = scores.B;
    $("explain").textContent = (pos === -1 ? "time's up! " : "") + item.explain;
    $("explain").classList.remove("hidden");
    $("btnNext").classList.remove("hidden");
    $("btnNext").focus();
  }

  function next() {
    idx++;
    if (idx >= round.length) return finish();
    showQuestion();
  }

  function finish() {
    $("game").classList.add("hidden");
    $("results").classList.remove("hidden");
    const correct = round.length - missed.length;
    let text = `${correct}/${round.length} correct.`;
    if (mode === "teams") {
      const w =
        scores.A === scores.B
          ? "It's a tie!"
          : `TEAM ${scores.A > scores.B ? "A" : "B"} wins!`;
      text += ` TEAM A ${scores.A} - TEAM B ${scores.B}. ${w}`;
    } else {
      text += ` Score: ${scores.A}`;
    }
    $("resultText").textContent = text;
    $("review").innerHTML = missed.length
      ? "<p class='muted'>review these:</p>"
      : "<p class='muted'>perfect round!</p>";
    missed.forEach((m) => {
      const div = document.createElement("div");
      div.className = "explain";
      div.innerHTML = `<b></b><br/><span class="muted">answer:</span> <span></span><br/><span class="muted"></span>`;
      div.children[0].textContent = m.q;
      div.children[3].textContent = m.choices[m.a];
      div.children[5].textContent = m.explain;
      $("review").appendChild(div);
    });
  }

  $("btnNext").addEventListener("click", next);
  $("btnAgain").addEventListener("click", () => {
    $("results").classList.add("hidden");
    $("setup").classList.remove("hidden");
  });

  document.addEventListener("keydown", (e) => {
    if ($("game").classList.contains("hidden")) return;
    const k = KEYS.indexOf(e.key);
    if (k !== -1 && !answered && k < $("choices").children.length) answer(k);
    else if (e.key === "Enter" && answered) {
      e.preventDefault(); // stop the focused "next" button from also firing a click
      next();
    }
  });

  $("btnFullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });
})();
