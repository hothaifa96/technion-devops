# Multibranch Pipelines, Webhooks & Branching Strategy

## Multibranch Pipeline

Point Jenkins at a repo; it **scans** branches/PRs/tags and creates a sub-job for each one that has a `Jenkinsfile`.

```
jokes-app (multibranch)
├── main
├── develop
├── feature/login
├── PR-17
└── v1.2.0 (tag)
```

Setup: New Item → Multibranch Pipeline → Branch Sources: GitHub (credentials + repo URL) → Behaviours: discover branches, PRs, tags → Scan triggers (periodic fallback + webhook).

### Branch-aware Jenkinsfile

```groovy
stage('Deploy dev')     { when { branch 'develop' }                    steps { deploy('dev') } }
stage('Deploy staging') { when { branch 'main' }                       steps { deploy('staging') } }
stage('Deploy prod')    { when { buildingTag() }                       steps { deploy('prod') } }
stage('PR checks')      { when { changeRequest() }                     steps { sh 'make lint' } }
```

Variables: `BRANCH_NAME`, `CHANGE_ID`, `CHANGE_TARGET`, `CHANGE_AUTHOR`, `TAG_NAME`.

---

## Webhooks

| Provider | URL |
|----------|-----|
| GitHub | `http://<jenkins>/github-webhook/` (content type JSON, push + PR events) |
| GitLab | `http://<jenkins>/project/<job>` |
| Bitbucket | `http://<jenkins>/bitbucket-hook/` |

Local Jenkins: `ngrok http 8080` and use the https ngrok URL.

### Commit status / PR checks

GitHub Branch Source reports build status back to the PR → enable **branch protection** "require status checks to pass".

---

## Branching strategies

| Strategy | Flow | Fits |
|----------|------|------|
| **Trunk-based** | short-lived feature branches → PR → `main`; deploy from main; feature flags | CI/CD, fast teams |
| **GitFlow** | `feature/*` → `develop` → `release/*` → `main` + `hotfix/*` | versioned releases |
| **GitHub flow** | feature branch → PR → main → deploy | simple web apps |

### Typical pipeline per branch type

| Branch | Pipeline |
|--------|----------|
| PR | build, unit tests, lint, security scan (no push) |
| develop / main | + build & push image, deploy to dev/staging |
| tag `v*` | + promote image, deploy prod (with approval) |

---

## Versioning images

```groovy
environment {
    SHORT_SHA = "${env.GIT_COMMIT.take(7)}"
    IMAGE_TAG = "${env.BRANCH_NAME == 'main' ? '' : env.BRANCH_NAME.replaceAll('/', '-') + '-'}${env.BUILD_NUMBER}-${SHORT_SHA}"
}
```

Tag images with **immutable** tags (SHA/semver), never redeploy `latest`.
