set -euo pipefail
install -d -m 0755 /run/sshd
ssh-keygen -A
install -d -m 0700 -o ansible -g ansible /home/ansible/.ssh
install -m 0600 -o ansible -g ansible /public/id_ed25519.pub /home/ansible/.ssh/authorized_keys
exec /usr/sbin/sshd -D -e
