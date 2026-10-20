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

    static String fromBuild(String buildNumber, String base = '1.0') {
        return "${base}.${buildNumber}"
    }
}
