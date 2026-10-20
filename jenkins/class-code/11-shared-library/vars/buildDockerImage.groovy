/**
 * buildDockerImage(image: 'user/app', tag: '1.0', context: '.', push: true, credentialsId: 'dockerhub-creds')
 * Returns the full image reference.
 */
def call(Map config = [:]) {
    def image   = config.image ?: error('buildDockerImage: "image" is required')
    def tag     = config.tag ?: env.BUILD_NUMBER
    def context = config.context ?: '.'
    def ref     = "${image}:${tag}"

    sh "docker build -t ${ref} ${context}"

    if (config.push) {
        withCredentials([usernamePassword(credentialsId: config.credentialsId ?: 'dockerhub-creds',
                                          usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
            sh 'echo $REG_PASS | docker login -u $REG_USER --password-stdin'
            sh "docker push ${ref}"
            sh 'docker logout'
        }
    }
    return ref
}
