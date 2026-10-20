/**
 * notify(status: currentBuild.currentResult)
 * Replace the echo with slackSend / mail in a real setup.
 */
def call(Map config = [:]) {
    def status = config.status ?: currentBuild.currentResult
    def icon = [SUCCESS: '[OK]', UNSTABLE: '[WARN]', FAILURE: '[FAIL]'][status] ?: '[INFO]'
    echo "${icon} ${env.JOB_NAME} #${env.BUILD_NUMBER} finished with ${status} - ${env.BUILD_URL}"
}
