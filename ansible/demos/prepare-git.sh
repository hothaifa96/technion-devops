#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends git curl

if [ -e classroom-site.bundle ]; then
  printf 'classroom-site.bundle already exists; keeping the existing training releases.\n'
  exit 0
fi

if [ -e classroom-site ]; then
  printf 'classroom-site already exists without a bundle. Inspect it before retrying.\n' >&2
  exit 1
fi

git init -b main classroom-site
cd classroom-site
printf '<!doctype html><html><body><h1>Classroom release v1</h1></body></html>\n' > index.html
git add index.html
git -c user.name='Classroom Demo' -c user.email='classroom@example.invalid' commit -m 'Publish classroom v1'
git tag v1
printf '<!doctype html><html><body><h1>Classroom release v2</h1></body></html>\n' > index.html
git add index.html
git -c user.name='Classroom Demo' -c user.email='classroom@example.invalid' commit -m 'Publish classroom v2'
git tag v2
git bundle create ../classroom-site.bundle --all
printf '\nCreated a self-contained Git repository with v1 and v2 tags.\n'
