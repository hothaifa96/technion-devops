# 02 — Inventory, configuration, and SSH

## Inventory models your fleet

Inventory maps logical groups to connection targets. It can be static YAML/INI or generated dynamically from an infrastructure API.

```yaml
all:
  children:
    web:
      hosts:
        web1:
        web2:
    operations:
      hosts:
        ops1:
```

In the lab, Compose resolves these names. For a VM, a logical name can use `ansible_host: 10.0.1.20`. `ansible_user` controls the connection user; `become_user` controls the escalation destination. They are not interchangeable.

Inspect before executing:

```bash
docker compose exec controller ansible-inventory --graph
docker compose exec controller ansible-inventory --host web1
docker compose exec controller ansible all --list-hosts
docker compose exec controller ansible 'web:operations' --list-hosts
```

Patterns support union (`web:operations`), intersection (`web:&staging`), and exclusion (`all:!operations`). Quote patterns to avoid shell interpretation. Use `--limit web1` to constrain a play further; it does not change its declared host group.

## Configuration discovery

Ansible searches `ANSIBLE_CONFIG`, then the current directory's `ansible.cfg`, then user and system locations, using the first configuration file found. It does not merge all those files. Inspect the active configuration with:

```bash
docker compose exec controller ansible --version
docker compose exec controller ansible-config dump --only-changed
```

The lab explicitly sets `ANSIBLE_CONFIG=/work/ansible.cfg`, so its behavior does not depend on home-directory discovery. Keep host-key checking enabled.

## SSH trust and privilege

Two different keys are involved:

- The user's private/public key pair authenticates the controller to the target.
- The target's SSH host key authenticates the target to the controller.

The bootstrap script creates a training identity in a Docker volume, installs only its public key on nodes, and adds target host keys obtained through Docker to the controller's `known_hosts`. Recreating target containers can change their host keys; rerun bootstrap only when that recreation is intentional. Do not suppress host-key mismatch warnings on real infrastructure without investigating.

The lab connects as `ansible`. Root login and password login are disabled. `become: true` invokes sudo for tasks requiring system permissions. Passwordless sudo is a deliberate lab convenience, not a recommended fleet-wide default.

## Ad-hoc commands

Run from `ansible/class-code/docker-lab`:

```bash
docker compose exec controller ansible all -m ansible.builtin.ping
docker compose exec controller ansible all -m ansible.builtin.command -a 'id'
docker compose exec controller ansible all -b -m ansible.builtin.command -a 'id'
docker compose exec controller ansible web -m ansible.builtin.setup -a 'filter=ansible_distribution*'
docker compose exec controller ansible web -b -m ansible.builtin.apt -a 'name=curl state=present update_cache=true'
```

Ansible `ping` is not ICMP ping. It tests connection, authentication, and Python module execution. `command` runs a program without shell expansion; use `shell` only when you truly need pipes, redirection, or shell syntax. Ad-hoc operations are useful for discovery but reviewed playbooks are better for repeatable changes.

## Exercise

List only the operations group, retrieve its Python version, then explain why a command can connect successfully yet fail to write `/etc/motd` without become.
