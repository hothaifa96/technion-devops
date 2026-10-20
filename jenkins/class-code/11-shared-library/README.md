# 11 - Shared Library

This folder is laid out exactly like a shared-library repository:

```
vars/        global steps: buildDockerImage, notify, pythonPipeline
src/         classes: org.devops.Semver
resources/   files loaded with libraryResource
```

To use it in class, copy this folder to its own Git repo (`jenkins-shared-lib`), then register it under
**Manage Jenkins → System → Global Pipeline Libraries** as `devops-lib`.

See [Jenkinsfile.example](Jenkinsfile.example).
