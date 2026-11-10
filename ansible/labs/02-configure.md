# Lab 02 — Declare state and prove convergence

## Goal

Apply a baseline and distinguish real changes from noisy reporting.

## Tasks

1. Syntax-check `playbooks/01-baseline.yml`.
2. Inspect its target list with `--list-hosts`.
3. Apply normally once to bootstrap package metadata and module dependencies, then run with `--check --diff`. Change the banner text and use check mode to predict its diff before applying again.
4. Run it normally a second time and compare recaps.
5. Create a scratch playbook that installs `jq` and creates `/srv/demo/data` on all hosts, owned by root with mode `0750`.
6. Use `ansible.builtin.stat` to verify the directory's mode. Avoid shell for file creation.

## Acceptance criteria

- All three machines have baseline packages and managed directories.
- Your scratch playbook converges with zero changes on the second run.
- You can explain why an arbitrary shell command does not automatically become idempotent.

## Solution outline

Use `apt` with `state: present`, `file` with `state: directory`, and `become: true`. Use quoted mode strings. With `stat`, inspect the returned `stat.mode`; `0750` grants root full access, the owning group read/traverse, and others no access.

Check mode may predict changes without creating files. It does not replace actual integration execution.
