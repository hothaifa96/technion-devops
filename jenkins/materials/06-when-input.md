# Conditional Stages (when) & Manual Approval (input)

## when

A stage runs only if its `when` condition is true. Otherwise it shows as **skipped**.

```groovy
stage('Deploy to prod') {
    when {
        branch 'main'
    }
    steps { sh './deploy.sh prod' }
}
```

### Conditions

| Condition | Example |
|-----------|---------|
| `branch` | `branch 'main'`, `branch pattern: 'release/.*', comparator: 'REGEXP'` |
| `buildingTag` | any tag build |
| `tag` | `tag 'v*'` |
| `changeRequest` | PR builds: `changeRequest target: 'main'` |
| `environment` | `environment name: 'ENV', value: 'prod'` |
| `expression` | `expression { params.RUN_TESTS }` / `expression { return currentBuild.result == null }` |
| `changeset` | `changeset 'frontend/**'` - only if files changed |
| `triggeredBy` | `triggeredBy 'TimerTrigger'`, `triggeredBy cause: 'UserIdCause'` |
| `equals` | `equals expected: 'prod', actual: params.ENV` |
| `not` / `allOf` / `anyOf` | combine |

```groovy
when {
    allOf {
        branch 'main'
        not { changeRequest() }
        anyOf {
            environment name: 'DEPLOY', value: 'true'
            expression { params.FORCE_DEPLOY }
        }
    }
}
```

### Evaluate before agent / input

```groovy
stage('Prod') {
    agent { label 'deployer' }
    when {
        beforeAgent true          // don't allocate an agent if the condition is false
        beforeInput true          // don't ask for input if the condition is false
        branch 'main'
    }
    ...
}
```

---

## input - manual approval

```groovy
stage('Approve') {
    options { timeout(time: 1, unit: 'HOURS') }     // don't wait forever
    input {
        message 'Deploy to production?'
        ok 'Ship it!'
        submitter 'admin,release-managers'          // users / groups allowed
        submitterParameter 'APPROVER'
        parameters {
            choice(name: 'STRATEGY', choices: ['rolling', 'blue-green'], description: '')
        }
    }
    steps {
        echo "Approved by ${APPROVER}, strategy ${STRATEGY}"
    }
}
```

### input as a step (inside script)

```groovy
script {
    def answer = input message: 'Continue?', parameters: [booleanParam(name: 'GO', defaultValue: true)]
    echo "answer: ${answer}"
}
```

> Don't hold an executor while waiting for a human: use `agent none` at the top level, or `input` directive on a stage without an agent.

---

## Skipping the rest of the pipeline

```groovy
script {
    if (!fileExists('Dockerfile')) {
        currentBuild.result = 'NOT_BUILT'
        return             // ends this stage's steps only
    }
}
```

Use `when` instead whenever possible.
