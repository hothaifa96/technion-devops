(function () {
  const $ = (id) => document.getElementById(id);
  const topic = new URLSearchParams(location.search).get("topic") || "all";
  $("topicSelect").value = topic;
  $("topicSelect").addEventListener("change", (e) => (location.search = `?topic=${e.target.value}`));

  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const deck = shuffle(CHALLENGES.filter((c) => topic === "all" || c.topic === topic));

  let idx = 0;
  let score = 0;
  let streak = 0;
  let tries = 0;
  let hinted = false;
  const started = Date.now();
  const history = [];
  let histPos = 0;

  setInterval(() => ($("clock").textContent = `${Math.floor((Date.now() - started) / 1000)}s`), 1000);

  function print(text, cls) {
    const div = document.createElement("div");
    div.className = "term-line" + (cls ? " " + cls : "");
    div.textContent = text;
    $("log").appendChild(div);
    $("terminal").scrollTop = $("terminal").scrollHeight;
  }

  function ask() {
    if (idx >= deck.length) {
      print("");
      print(`### all challenges done! score ${score}, time ${$("clock").textContent} ###`, "term-ok");
      $("input").disabled = true;
      return;
    }
    tries = 0;
    hinted = false;
    $("progress").textContent = `${idx + 1}/${deck.length}`;
    print("");
    print(`# [${deck[idx].topic}] ${deck[idx].task}`, "term-hint");
  }

  const normalize = (s) => s.trim().replace(/\s+/g, " ");

  function check(input) {
    const c = deck[idx];
    return c.accept.some((r) => new RegExp(r).test(input));
  }

  function nextItem() {
    idx++;
    ask();
  }

  $("input").addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      histPos = Math.max(0, histPos - 1);
      $("input").value = history[histPos];
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown" && history.length) {
      histPos = Math.min(history.length, histPos + 1);
      $("input").value = history[histPos] || "";
      e.preventDefault();
      return;
    }
    if (e.key !== "Enter") return;
    const raw = $("input").value;
    const input = normalize(raw);
    $("input").value = "";
    if (!input || idx >= deck.length) return;
    history.push(input);
    histPos = history.length;
    print(`student@devops:~$ ${input}`);

    if (input === "clear") {
      $("log").innerHTML = "";
      print(`# [${deck[idx].topic}] ${deck[idx].task}`, "term-hint");
      return;
    }
    if (input === "hint") {
      if (!hinted) score = Math.max(0, score - 25);
      hinted = true;
      $("score").textContent = score;
      print(`hint: ${deck[idx].hint}`, "term-hint");
      return;
    }
    if (input === "skip") {
      streak = 0;
      $("streak").textContent = streak;
      print(`solution: ${deck[idx].solution}`, "term-err");
      nextItem();
      return;
    }

    tries++;
    if (check(input)) {
      streak++;
      const points = Math.max(25, 100 - (tries - 1) * 25) + Math.min(streak, 5) * 10;
      score += points;
      print(`✔ correct (+${points})`, "term-ok");
      if (input !== deck[idx].solution) print(`  reference: ${deck[idx].solution}`, "term-ok");
      nextItem();
    } else {
      streak = 0;
      print(tries >= 3 ? `✘ not quite. type 'hint' or 'skip'` : "✘ command not accepted, try again", "term-err");
    }
    $("score").textContent = score;
    $("streak").textContent = streak;
  });

  $("terminal").addEventListener("click", () => $("input").focus());
  $("btnFullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  print("devops terminal challenge - type the command that solves each task.");
  ask();
})();
