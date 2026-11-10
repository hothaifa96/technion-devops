# Lab 01 — Connect to the fleet

## Goal

Understand the connection path without installing Ansible on your laptop.

## Tasks

1. Read [architecture](../materials/01-fundamentals-architecture.md).
2. Enter `ansible/class-code/docker-lab` and run `bash bootstrap.sh`.
3. Run `docker compose exec controller ansible-inventory --graph`.
4. Test all targets using the ping module.
5. Run `id` on only the operations group, once with `-b` and once without.
6. Inspect `docker compose config`; identify private-key versus public-key mounts.

## Acceptance criteria

- Three hosts return `pong`.
- The normal identity is `ansible`; become yields root.
- Targets do not mount the private-key volume or publish SSH to the laptop.
- You can explain both user-key authentication and SSH host-key verification.

## Hints and solution outline

```bash
docker compose exec controller ansible all -m ansible.builtin.ping
docker compose exec controller ansible operations -m ansible.builtin.command -a id
docker compose exec controller ansible operations -b -m ansible.builtin.command -a id
```

Ansible ping uses SSH and Python, not ICMP. If a host is unreachable, use the troubleshooting guide before rebuilding anything.
