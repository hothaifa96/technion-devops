# Shared Libraries

Reuse pipeline code across many repositories (DRY). The library is a Git repo:

```
jenkins-shared-lib/
├── vars/                     # global steps - callable like built-in steps
│   ├── buildDockerImage.groovy   -> buildDockerImage(...)
│   ├── notifySlack.groovy        -> notifySlack(...)
│   └── standardPipeline.groovy   -> a whole pipeline template
├── src/                      # Groovy classes (package structure)
│   └── org/devops/Semver.groovy
└── resources/                # non-Groovy files (libraryResource)
    └── templates/deployment.yaml
```

---

## vars/ step

```groovy
// vars/buildDockerImage.groovy
def call(Map config = [:]) {
    def image = config.image ?: error('image is required')
    def tag   = config.tag   ?: env.BUILD_NUMBER
    def dir   = config.context ?: '.'
    sh "docker build -t ${image}:${tag} ${dir}"
    return "${image}:${tag}"
}
```

## Pipeline template

```groovy
// vars/standardPipeline.groovy
def call(Map cfg) {
    pipeline {
        agent any
        stages {
            stage('Build') { steps { script { env.IMG = buildDockerImage(image: cfg.image) } } }
            stage('Test')  { steps { sh cfg.testCommand ?: 'echo no tests' } }
        }
        post { failure { notifySlack(status: 'FAILED') } }
    }
}
```

Application Jenkinsfile becomes:

```groovy
@Library('devops-lib@main') _
standardPipeline(image: 'myuser/jokes', testCommand: 'pytest')
```

---

## src/ class

```groovy
// src/org/devops/Semver.groovy
package org.devops

class Semver implements Serializable {
    static String bump(String version, String part) {
        def (major, minor, patch) = version.tokenize('.').collect { it as int }
        switch (part) {
            case 'major': return "${major + 1}.0.0"
            case 'minor': return "${major}.${minor + 1}.0"
            default:      return "${major}.${minor}.${patch + 1}"
        }
    }
}
```

```groovy
@Library('devops-lib') import org.devops.Semver
echo Semver.bump('1.4.2', 'minor')   // 1.5.0
```

## resources/

```groovy
def yaml = libraryResource 'templates/deployment.yaml'
writeFile file: 'deployment.yaml', text: yaml
```

---

## Configure the library

Manage Jenkins → System → **Global Pipeline Libraries**:
- Name: `devops-lib`
- Default version: `main`
- Retrieval: Modern SCM → Git → repo URL
- *Load implicitly* (optional) → no `@Library` needed

Or dynamically in a Jenkinsfile:

```groovy
library identifier: 'devops-lib@main', retriever: modernSCM(
  [$class: 'GitSCMSource', remote: 'https://github.com/org/jenkins-shared-lib.git'])
```

---

## Tips

- `@Library('lib@v1.2.0')` - pin a tag for stability
- Classes in `src/` should implement `Serializable` (pipeline state is persisted)
- Steps in `vars/` have access to `env`, `sh`, `echo`...; classes in `src/` need the script passed in (`this`)
- Add `vars/<name>.txt` for help text in the Snippet Generator
