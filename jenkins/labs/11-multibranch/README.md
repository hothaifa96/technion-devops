# Lab 11: Multibranch Pipelines, Webhooks & PR Checks

## Objective

Automatically build every branch and PR, report status to GitHub and protect `main`.

## Prerequisites

- Read [12-multibranch-webhooks.md](../../materials/12-multibranch-webhooks.md)
- GitHub repo for the quotes app, GitHub personal access token, ngrok

## Exercise

### Step 1: Multibranch job
1. Add a GitHub credential (username + PAT).
2. Create a Multibranch Pipeline with GitHub branch source: discover branches, PRs from origin, tags.
3. Scan the repo. Which sub-jobs were created?

### Step 2: Webhook
Configure the GitHub webhook (`/github-webhook/`, push + pull_request). Create a branch, push - a new job appears automatically.

### Step 3: Branch logic
| Branch | Image tag | Push | Deploy |
|--------|-----------|------|--------|
| `feature/*` | `feature-x-<build>` | no | no |
| PR | - | no | no (lint + tests only) |
| `main` | `<build>-<sha7>` | yes | dev |
| tag `v*` | `<tag>` | yes | prod (with approval) |

Implement this with `when` + an `IMAGE_TAG` computed in `environment` / `script`.

### Step 4: PR status checks
1. Open a PR with a failing test. Check the status shown in GitHub.
2. Enable branch protection on `main` requiring the Jenkins check.
3. Fix the test - can you merge now?

### Step 5: Cleanup
Delete a merged branch. What happens to its Jenkins job (orphaned item strategy)?

## Challenge Exercise

1. Build only when relevant paths changed in a monorepo (`changeset 'services/api/**'`).
2. Use an Organization Folder to discover all repos in your GitHub account.

## Deliverables
Jenkinsfile + screenshots of PR checks and branch jobs.
