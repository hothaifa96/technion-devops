set -euo pipefail
cd "$(dirname "$0")"
docker compose up --build -d --wait --wait-timeout 180
docker compose exec -T controller bash -ec 'install -d -m 0700 /root/.ssh; : > /root/.ssh/known_hosts; chmod 0600 /root/.ssh/known_hosts'
for node in web1 web2 ops1; do
  key=$(docker compose exec -T "$node" cat /etc/ssh/ssh_host_ed25519_key.pub)
  printf '%s %s\n' "$node" "$key" | docker compose exec -T controller bash -ec 'cat >> /root/.ssh/known_hosts'
done
docker compose exec -T controller ansible all -m ansible.builtin.ping
