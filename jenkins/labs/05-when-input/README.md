# Lab 05: Conditional Stages & Manual Approvals

## Objective

Run stages only when it makes sense, and gate production behind a human approval.

## Prerequisites

- Read [06-when-input.md](../../materials/06-when-input.md)
- Reference: [class-code/04-when-input](../../class-code/04-when-input)

## Exercise

Create a **multibranch** pipeline for your quotes repo with branches `main`, `develop`, `feature/x`.

### Step 1: Branch-based stages
| Stage | Runs when |
|-------|-----------|
| Build & unit test | always |
| Push image | `main` or `develop` |
| Deploy dev | `develop` |
| Deploy staging | `main` |
| Deploy prod | building a tag `v*` |
| PR checks (lint) | `changeRequest()` |

### Step 2: Path-based
Add a stage `Docs` that runs only if files in `docs/**` changed (`changeset`).

### Step 3: Expression
Add a `SKIP_TESTS` boolean parameter. The test stage runs if `!params.SKIP_TESTS` **and** the branch is not `main` (tests are mandatory on main).

### Step 4: Approval
1. Before `Deploy prod`, add an `input` stage: message, ok text, `submitter` = your admin user, a `choice` parameter `STRATEGY`.
2. Save the approver name with `submitterParameter`.
3. Add a 10 minute `timeout`. What is the build result when nobody approves?

### Step 5: Executors
1. Check **Build Executor Status** while the build waits for input - is an executor busy?
2. Fix it with `agent none` at the top level and per-stage agents.

### Step 6: beforeAgent
Show with timestamps that `beforeAgent true` avoids allocating an agent when the `when` condition is false.

## Challenge Exercise

1. Allow only users in the group `release-managers` to approve (Role Strategy plugin).
2. After approval, record the approver and strategy in `currentBuild.description`.

## Deliverables
Jenkinsfile + screenshots of skipped stages and the input dialog.
