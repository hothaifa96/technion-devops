# Job Types & Pipeline Styles

## Job types

| Type | Description | Use |
|------|-------------|-----|
| **Freestyle** | Configured with UI forms (build steps, post-build actions) | legacy / quick scripts |
| **Pipeline** | Defined in a `Jenkinsfile` (inline or from SCM) | standard |
| **Multibranch Pipeline** | Auto-creates a pipeline per branch / PR that contains a Jenkinsfile | standard for teams |
| **Organization Folder** | Scans a GitHub org / Bitbucket project and creates multibranch jobs for every repo | large orgs |
| **Folder** | Group jobs, scoped credentials | organization |

---

## Pipeline as Code - why?

- Versioned in Git with the application
- Code review for pipeline changes
- Survives Jenkins restarts (durable)
- Reusable (shared libraries)
- Visualized as stages

---

## Declarative vs Scripted

```groovy
// DECLARATIVE - structured, opinionated, validated, easy to read
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
    post {
        always { echo 'done' }
    }
}
```

```groovy
// SCRIPTED - plain Groovy, full flexibility, harder to maintain
node {
    stage('Build') {
        try {
            sh 'make build'
        } finally {
            echo 'done'
        }
    }
}
```

| | Declarative | Scripted |
|---|---|---|
| Root block | `pipeline { }` | `node { }` |
| Syntax validation | before run | at runtime |
| `post`, `when`, `options`, `parameters` | built in | manual (try/catch, if) |
| Groovy logic | inside `script { }` | everywhere |
| Recommended | ✔ | for advanced cases |

---

## Where the Jenkinsfile comes from

1. **Pipeline script** - pasted in the job UI (good for experiments)
2. **Pipeline script from SCM** - Jenkins clones the repo and reads `Jenkinsfile` (or a custom path) ✔

---

## Replay & Restart

- **Replay** - edit the Jenkinsfile of a past build and rerun (debugging, no commit)
- **Restart from stage** - rerun a declarative pipeline from a given stage
- **Pipeline Syntax / Snippet Generator** - `<job>/pipeline-syntax` generates step code
- **Declarative Directive Generator** - generates `options`, `triggers`, `parameters`, `when`...
