(function () {
  const params = new URLSearchParams(location.search);
  const BOARD_ID = BOARDS[params.get("board")]
    ? params.get("board")
    : Object.keys(BOARDS)[0];
  const BOARD = BOARDS[BOARD_ID].categories;
  const STORAGE_KEY = `devops-jeopardy-multi-${BOARD_ID}-v1`;

  const topicSelect = document.getElementById("topicSelect");
  Object.entries(BOARDS).forEach(([id, b]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = b.title;
    opt.selected = id === BOARD_ID;
    topicSelect.appendChild(opt);
  });
  topicSelect.addEventListener("change", () => {
    location.search = `?board=${topicSelect.value}`;
  });
  document.title = `// jeopardy: ${BOARDS[BOARD_ID].title}`;

  const boardEl = document.getElementById("board");
  boardEl.style.gridTemplateColumns = `repeat(${BOARD.length}, 1fr)`;
  const modalOverlay = document.getElementById("modalOverlay");
  const modalCategory = document.getElementById("modalCategory");
  const modalValue = document.getElementById("modalValue");
  const modalQuestion = document.getElementById("modalQuestion");
  const modalAnswer = document.getElementById("modalAnswer");
  const btnReveal = document.getElementById("btnReveal");
  const awardRow = document.getElementById("awardRow");
  const btnAwardA = document.getElementById("btnAwardA");
  const btnAwardB = document.getElementById("btnAwardB");
  const btnAwardNone = document.getElementById("btnAwardNone");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const scoreAEl = document.getElementById("scoreA");
  const scoreBEl = document.getElementById("scoreB");
  const nameAEl = document.getElementById("nameA");
  const nameBEl = document.getElementById("nameB");
  const activeTeamLabel = document.getElementById("activeTeamLabel");

  let state = {
    scores: { A: 0, B: 0 },
    names: { A: "TEAM A", B: "TEAM B" },
    used: {}, // key: "catIdx-clueIdx" -> true
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(state, parsed);
      }
    } catch (e) {
      /* ignore corrupt state */
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function render() {
    scoreAEl.textContent = state.scores.A;
    scoreBEl.textContent = state.scores.B;
    nameAEl.value = state.names.A;
    nameBEl.value = state.names.B;
    renderBoard();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    BOARD.forEach((cat, catIdx) => {
      const head = document.createElement("div");
      head.className = "category-head";
      head.textContent = cat.category;
      boardEl.appendChild(head);
    });
    const maxClues = Math.max(...BOARD.map((c) => c.clues.length));
    for (let row = 0; row < maxClues; row++) {
      BOARD.forEach((cat, catIdx) => {
        const clue = cat.clues[row];
        const tile = document.createElement("div");
        const key = `${catIdx}-${row}`;
        const isUsed = !!state.used[key];
        tile.className = "tile" + (isUsed ? " used" : "");
        tile.innerHTML = `<span>$${clue.value}</span>`;
        if (!isUsed) {
          tile.addEventListener("click", () => openClue(catIdx, row));
        }
        boardEl.appendChild(tile);
      });
    }
  }

  let currentClueKey = null;

  function openClue(catIdx, row) {
    const cat = BOARD[catIdx];
    const clue = cat.clues[row];
    currentClueKey = `${catIdx}-${row}`;
    modalCategory.textContent = cat.category;
    modalValue.textContent = `$${clue.value}`;
    modalQuestion.textContent = clue.question;
    modalAnswer.textContent = clue.answer;
    modalAnswer.classList.add("hidden");
    btnReveal.classList.remove("hidden");
    awardRow.classList.add("hidden");
    modalOverlay.classList.remove("hidden");
    activeTeamLabel.textContent = `in progress ($${clue.value})`;
  }

  function closeClue(markUsed) {
    if (markUsed && currentClueKey) {
      state.used[currentClueKey] = true;
      saveState();
      renderBoard();
    }
    modalOverlay.classList.add("hidden");
    currentClueKey = null;
    activeTeamLabel.textContent = "standby";
  }

  btnReveal.addEventListener("click", () => {
    modalAnswer.classList.remove("hidden");
    btnReveal.classList.add("hidden");
    awardRow.classList.remove("hidden");
  });

  function currentClueValue() {
    if (!currentClueKey) return 0;
    const [catIdx, row] = currentClueKey.split("-").map(Number);
    return BOARD[catIdx].clues[row].value;
  }

  function flashScore(team) {
    const el = team === "A" ? scoreAEl : scoreBEl;
    el.style.transition = "none";
    el.style.textShadow = "0 0 30px currentColor";
    requestAnimationFrame(() => {
      el.style.transition = "text-shadow 0.6s ease";
      el.style.textShadow = "";
    });
  }

  btnAwardA.addEventListener("click", () => {
    state.scores.A += currentClueValue();
    saveState();
    scoreAEl.textContent = state.scores.A;
    flashScore("A");
    closeClue(true);
  });

  btnAwardB.addEventListener("click", () => {
    state.scores.B += currentClueValue();
    saveState();
    scoreBEl.textContent = state.scores.B;
    flashScore("B");
    closeClue(true);
  });

  btnAwardNone.addEventListener("click", () => closeClue(true));
  btnCloseModal.addEventListener("click", () => closeClue(false));

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeClue(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
      closeClue(false);
    }
  });

  // Manual score adjustment controls
  document.querySelectorAll(".score-btn[data-amount]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const team = btn.getAttribute("data-team");
      const amount = Number(btn.getAttribute("data-amount"));
      state.scores[team] += amount;
      saveState();
      render();
      flashScore(team);
    });
  });

  document.querySelectorAll(".score-btn[data-custom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const team = btn.getAttribute("data-team");
      const input = document.getElementById(`custom${team}`);
      const val = parseInt(input.value, 10);
      if (!isNaN(val)) {
        state.scores[team] += val;
        saveState();
        render();
        flashScore(team);
        input.value = "";
      }
    });
  });

  nameAEl.addEventListener("input", () => {
    state.names.A = nameAEl.value || "TEAM A";
    saveState();
  });
  nameBEl.addEventListener("input", () => {
    state.names.B = nameBEl.value || "TEAM B";
    saveState();
  });

  document.getElementById("btnResetBoard").addEventListener("click", () => {
    if (
      confirm("Clear all consumed tiles and reset the board? Scores are kept.")
    ) {
      state.used = {};
      saveState();
      renderBoard();
    }
  });

  document.getElementById("btnResetScores").addEventListener("click", () => {
    if (confirm("Reset both team scores to 0?")) {
      state.scores = { A: 0, B: 0 };
      saveState();
      render();
    }
  });

  document.getElementById("btnFullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });

  loadState();
  render();
})();
