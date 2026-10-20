# Parameters & Triggers

## Parameters

```groovy
pipeline {
    agent any
    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Docker image tag')
        choice(name: 'ENV', choices: ['dev', 'staging', 'prod'], description: 'Target environment')
        booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Run tests?')
        text(name: 'NOTES', defaultValue: '', description: 'Release notes')
        password(name: 'TEMP_TOKEN', defaultValue: '', description: 'One-time token')
    }
    stages {
        stage('Info') {
            steps {
                echo "Deploying ${params.IMAGE_TAG} to ${params.ENV}"
                script {
                    if (params.RUN_TESTS) { echo 'tests enabled' }
                }
            }
        }
    }
}
```

- Access with `params.NAME` (typed) or `env.NAME` / `$NAME` in shell (string)
- The first run of a new Jenkinsfile registers the parameters → the button becomes **Build with Parameters** from the second run
- Trigger with parameters via API:

```bash
curl -X POST -u user:API_TOKEN \
  "http://jenkins:8080/job/deploy/buildWithParameters?ENV=staging&IMAGE_TAG=1.4.2"
```

---

## Triggers

```groovy
triggers {
    cron('H 2 * * 1-5')                       // nightly on weekdays
    pollSCM('H/5 * * * *')                    // check git every ~5 min (prefer webhooks!)
    upstream(upstreamProjects: 'build-lib', threshold: hudson.model.Result.SUCCESS)
}
```

### The `H` symbol

`H` = hash of the job name → spreads load. `H/15 * * * *` = every 15 minutes at a job-specific offset.

| Cron | Meaning |
|------|---------|
| `H * * * *` | once an hour |
| `H/10 * * * *` | every 10 minutes |
| `H 2 * * *` | daily ~02:xx |
| `H 8 * * 1-5` | weekdays ~08:xx |
| `@daily`, `@hourly`, `@midnight` | aliases |

### Webhooks (preferred)

- **GitHub**: repo → Settings → Webhooks → `http://<jenkins>/github-webhook/` + `triggers { githubPush() }` (or multibranch auto)
- **GitLab**: `http://<jenkins>/project/<job>`
- Local Jenkins? use `ngrok http 8080` / smee.io to expose it

### Trigger another job

```groovy
build job: 'deploy', wait: false, parameters: [
    string(name: 'IMAGE_TAG', value: env.BUILD_NUMBER),
    string(name: 'ENV', value: 'staging')
]
```

### Remote trigger with a token

Job → Configure → *Trigger builds remotely* → token → `curl http://jenkins/job/x/build?token=TOKEN`
