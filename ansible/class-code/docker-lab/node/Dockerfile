FROM ubuntu:24.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openssh-server python3 sudo ca-certificates && rm -rf /var/lib/apt/lists/* && rm -f /etc/ssh/ssh_host_* && useradd --create-home --shell /bin/bash ansible && passwd -d ansible && printf 'ansible ALL=(ALL) NOPASSWD: ALL\n' > /etc/sudoers.d/ansible && chmod 0440 /etc/sudoers.d/ansible && printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin no\nAllowUsers ansible\n' > /etc/ssh/sshd_config.d/00-training.conf
COPY entrypoint.sh /usr/local/bin/node-entrypoint
EXPOSE 22 80
ENTRYPOINT ["bash", "/usr/local/bin/node-entrypoint"]
