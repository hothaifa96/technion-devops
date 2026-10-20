/**
 * A complete pipeline template for Python services.
 *
 *   @Library('devops-lib') _
 *   pythonPipeline(image: 'myuser/jokes', appDir: 'app', pythonVersion: '3.12')
 */
def call(Map cfg) {
    def appDir = cfg.appDir ?: '.'
    def py     = cfg.pythonVersion ?: '3.12'

    pipeline {
        agent any
        options { timestamps(); timeout(time: 20, unit: 'MINUTES') }
        environment {
            VERSION = "${org.devops.Semver.fromBuild(env.BUILD_NUMBER)}"
        }
        stages {
            stage('Test') {
                agent { docker { image "python:${py}-slim"; reuseNode true } }
                steps {
                    dir(appDir) {
                        sh 'pip install -q -r requirements.txt pytest && (pytest -q || [ $? -eq 5 ])'
                    }
                }
            }
            stage('Build image') {
                steps {
                    script {
                        env.IMAGE_REF = buildDockerImage(image: cfg.image, tag: env.VERSION, context: appDir,
                                                         push: env.BRANCH_NAME == 'main')
                    }
                }
            }
        }
        post {
            always { notify() }
        }
    }
}
