#!/usr/bin/env bash
set -euo pipefail

network=ansible-demo
machines=(ansible-server host1 host2 host3)
hosts=(host1 host2 host3)

docker info >/dev/null

for machine in "${machines[@]}"; do
  if docker container inspect "$machine" >/dev/null 2>&1; then
    label=$(docker inspect --format '{{index .Config.Labels "teaching.lab"}}' "$machine")
    if [ "$label" != ansible-demo ]; then
      printf 'Refusing to modify %s: it is not labelled as this training lab.\n' "$machine" >&2
      exit 1
    fi
    if [ "$(docker inspect --format '{{.Config.Image}}' "$machine")" != ubuntu:24.04 ]; then
      printf 'Expected %s to use ubuntu:24.04.\n' "$machine" >&2
      exit 1
    fi
  fi
done

if ! docker network inspect "$network" >/dev/null 2>&1; then
  docker network create "$network"
fi

for machine in "${machines[@]}"; do
  if ! docker container inspect "$machine" >/dev/null 2>&1; then
    docker run -d --name "$machine" --hostname "$machine" \
      --network "$network" --label teaching.lab=ansible-demo \
      ubuntu:24.04 sleep infinity
  else
    if [ "$(docker inspect --format '{{.State.Running}}' "$machine")" != true ]; then
      docker start "$machine"
    fi
    attached=$(docker inspect --format '{{if index .NetworkSettings.Networks "ansible-demo"}}yes{{end}}' "$machine")
    if [ "$attached" != yes ]; then
      docker network connect "$network" "$machine"
    fi
  fi
done

printf '\nInstalling Ansible on the server...\n'
docker exec -i ansible-server bash -s <<'SERVER'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ansible openssh-client iputils-ping nano
install -d -m 0700 /root/.ssh
if [ ! -s /root/.ssh/id_ed25519 ]; then
  ssh-keygen -q -t ed25519 -N '' -f /root/.ssh/id_ed25519
fi
ssh-keygen -y -f /root/.ssh/id_ed25519 > /root/.ssh/id_ed25519.pub
SERVER

for host in "${hosts[@]}"; do
  printf '\nConfiguring SSH, Python, and sudo on %s...\n' "$host"
  docker exec -i "$host" bash -s <<'HOST'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y openssh-server python3 sudo iproute2 nano
if ! id ansible >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash ansible
  passwd -d ansible
fi
usermod -aG sudo ansible
printf 'ansible ALL=(ALL:ALL) NOPASSWD: ALL\n' > /etc/sudoers.d/ansible-demo
chmod 0440 /etc/sudoers.d/ansible-demo
visudo -cf /etc/sudoers.d/ansible-demo
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin no\nAllowUsers ansible\n' > /etc/ssh/sshd_config.d/00-ansible-demo.conf
install -d -m 0755 /run/sshd
ssh-keygen -A
install -d -m 0700 -o ansible -g ansible /home/ansible/.ssh
HOST

  docker exec ansible-server cat /root/.ssh/id_ed25519.pub |
    docker exec -i "$host" bash -ec 'cat > /home/ansible/.ssh/authorized_keys; chown ansible:ansible /home/ansible/.ssh/authorized_keys; chmod 0600 /home/ansible/.ssh/authorized_keys'

  docker exec "$host" bash -ec '/usr/sbin/sshd -t; service ssh restart'
  host_key=$(docker exec "$host" cat /etc/ssh/ssh_host_ed25519_key.pub)
  docker exec ansible-server bash -ec 'touch /root/.ssh/known_hosts; chmod 0600 /root/.ssh/known_hosts'
  docker exec ansible-server ssh-keygen -R "$host" >/dev/null 2>&1
  printf '%s %s\n' "$host" "$host_key" |
    docker exec -i ansible-server bash -ec 'cat >> /root/.ssh/known_hosts'
done

printf '\nCreating inventory on the server...\n'
docker exec -i ansible-server bash -s <<'INVENTORY'
set -euo pipefail
install -d /etc/ansible
cat > /etc/ansible/demo-hosts <<'HOSTS'
[mygroup]
host1
host2
host3

[all:vars]
ansible_user=ansible
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_private_key_file=/root/.ssh/id_ed25519
HOSTS
INVENTORY

printf '\nTesting SSH and Python on all three hosts...\n'
docker exec ansible-server ansible all -i /etc/ansible/demo-hosts -m ansible.builtin.ping
printf '\nTesting passwordless sudo on all three hosts...\n'
docker exec ansible-server ansible all -i /etc/ansible/demo-hosts --become -m ansible.builtin.command -a whoami

printf '\nLab ready. Open the controller:\n  docker exec -it ansible-server bash\n'
printf '\nInside the controller, run:\n'
printf '  ansible-inventory -i /etc/ansible/demo-hosts --graph\n'
printf '  ansible all -i /etc/ansible/demo-hosts -m ansible.builtin.ping\n'
printf '\nOpen targets with: docker exec -it host1 bash (or host2 / host3).\n'
printf 'Rerun this script after restarting the containers to start SSH and check connectivity.\n'
printf 'Training only: hosts allow passwordless sudo for the ansible user. No SSH ports are published.\n'
