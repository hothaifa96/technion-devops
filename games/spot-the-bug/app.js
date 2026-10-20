(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const topic = params.get("topic") || "all";
  $("topicSelect").value = topic;
  $("topicSelect").addEventListener("change", (e) => (location.search = `?topic=${e.target.value}`));

  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const deck = shuffle(BUGS.filter((b) => topic === "all" || b.topic === topic));

  let idx = 0;
  let score = 0;
  let selected = new Set();
  let done = false;
  let attempts = 0;
  let hinted = false;

  function render() {
    const item = deck[idx];
    selected = new Set();
    done = false;
    attempts = 0;
    hinted = false;
    $("progress").textContent = `${idx + 1}/${deck.length}`;
    $("titlePill").innerHTML = "";
    $("titlePill").append(item.title);
    const tag = document.createElement("span");
    tag.className = "lang-tag";
    tag.textContent = `${item.topic} / ${item.lang}`;
    $("titlePill").appendChild(tag);
    $("code").innerHTML = "";
    item.code.split("\n").forEach((text, i) => {
      const line = document.createElement("span");
      line.className = "line";
      line.textContent = text || " ";
      line.addEventListener("click", () => toggle(i + 1, line));
      $("code").appendChild(line);
    });
    $("feedback").classList.add("hidden");
    $("btnNext").classList.add("hidden");
    ["btnCheck", "btnHint", "btnReveal"].forEach((b) => $(b).classList.remove("hidden"));
  }

  function toggle(n, el) {
    if (done) return;
    if (selected.has(n)) {
      selected.delete(n);
      el.classList.remove("selected");
    } else {
      selected.add(n);
      el.classList.add("selected");
    }
  }

  function lines() {
    return [...$("code").children];
  }

  function feedback(text) {
    $("feedback").textContent = text;
    $("feedback").classList.remove("hidden");
  }

  function finishItem(found) {
    done = true;
    const item = deck[idx];
    lines().forEach((l, i) => {
      l.classList.remove("selected");
      if (item.bug.includes(i + 1)) l.classList.add(found ? "found" : "bug");
    });
    feedback((found ? "Correct! " : "") + item.explain);
    ["btnCheck", "btnHint", "btnReveal"].forEach((b) => $(b).classList.add("hidden"));
    $("btnNext").classList.remove("hidden");
    $("btnNext").textContent = idx + 1 >= deck.length ? "finish" : "next >>";
  }

  $("btnCheck").addEventListener("click", () => {
    if (done || !selected.size) return;
    const item = deck[idx];
    const hit = [...selected].some((n) => item.bug.includes(n));
    const wrongPicks = [...selected].filter((n) => !item.bug.includes(n)).length;
    attempts++;
    if (hit) {
      score += Math.max(50, 300 - (attempts - 1) * 100 - wrongPicks * 25);
      $("score").textContent = score;
      finishItem(true);
    } else {
      feedback(`Not there (attempt ${attempts}). Try again or ask for a hint.`);
    }
  });

  $("btnHint").addEventListener("click", () => {
    if (done || hinted) return;
    hinted = true;
    const item = deck[idx];
    score = Math.max(0, score - 50);
    $("score").textContent = score;
    const first = item.bug[0];
    const from = Math.max(1, first - 2);
    const to = Math.min(item.code.split("\n").length, first + 2);
    feedback(`Hint: look between lines ${from} and ${to}.`);
  });

  $("btnReveal").addEventListener("click", () => !done && finishItem(false));

  $("btnNext").addEventListener("click", () => {
    idx++;
    if (idx >= deck.length) {
      $("code").innerHTML = "";
      $("btnNext").classList.add("hidden");
      feedback(`Round complete! Final score: ${score} / ${deck.length * 300}. Pick another topic or reload to reshuffle.`);
      return;
    }
    render();
  });

  $("btnFullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  render();
})();
