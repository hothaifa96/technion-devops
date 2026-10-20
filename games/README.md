# DevOps Games

Static HTML/JS games for class - no build, no server needed (open `index.html`), or serve the repo:

```bash
python3 -m http.server 8000      # from the repo root
open http://localhost:8000/games/
```

| Game | What | How to play |
|------|------|-------------|
| [jeopardy](jeopardy) | One board per topic: `?board=docker` / `kubernetes` / `helm` / `jenkins` / `observability` | Host clicks a tile, reveals the answer, awards a team. State saved per board in localStorage |
| [quiz-show](quiz-show) | Timed multiple-choice, speed bonus, solo or 2 alternating teams | Keys 1-4 to answer, Enter for next |
| [spot-the-bug](spot-the-bug) | Find the broken line in Dockerfiles, YAML, Helm templates, Jenkinsfiles, PromQL | Click line(s) → check. Hints cost points |
| [terminal-challenge](terminal-challenge) | Type the command / step / query that solves the task | `hint`, `skip`, `clear`, ↑ for history |
| [../devops-jeopardy](../devops-jeopardy) | Original mixed-topic board | |

## Adding content

| File | Format |
|------|--------|
| `jeopardy/boards.js` | `BOARDS.<id> = { title, categories: [{ category, clues: [{ value, question, answer }] }] }` |
| `quiz-show/questions.js` | `QUIZ.<topic> = [{ q, choices: [4], a: <index>, explain }]` |
| `spot-the-bug/bugs.js` | `{ topic, lang, title, code, bug: [line numbers], explain }` (escape `${` as `\${` in code) |
| `terminal-challenge/challenges.js` | `{ topic, task, accept: [regex], hint, solution }` |

Shared look & feel: `shared/theme.css`.
