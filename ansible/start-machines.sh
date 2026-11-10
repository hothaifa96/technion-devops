#!/usr/bin/env bash
set -euo pipefail

network=ansible-demo
machines=(ansible-server host1 host2 host3)

docker info >/dev/null

for machine in "${machines[@]}"; do
  if docker container inspect "$machine" >/dev/null 2>&1; then
    printf 'Container %s already exists. No containers were created.\n' "$machine" >&2
    exit 1
  fi
done

docker pull ubuntu:24.04

if ! docker network inspect "$network" >/dev/null 2>&1; then
  docker network create "$network"
fi

for machine in "${machines[@]}"; do
  docker run -d \
    --name "$machine" \
    --hostname "$machine" \
    --network "$network" \
    --label teaching.lab=ansible-demo \
    ubuntu:24.04 sleep infinity
done

printf '\nFour Ubuntu training containers are running:\n'
docker ps --filter label=teaching.lab=ansible-demo \
  --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'

printf '\nOpen a separate terminal for each machine and run:\n'
for machine in "${machines[@]}"; do
  printf '  docker exec -it %s bash\n' "$machine"
done

printf '\nPackages, SSH, users, and Ansible are not installed yet. Set them up during the lesson.\n'
printf 'Use host1, host2, and host3 as inventory names; Docker resolves them on %s.\n' "$network"
printf '\nTo stop the machines without deleting their files:\n'
printf '  docker stop %s\n' "${machines[*]}"
