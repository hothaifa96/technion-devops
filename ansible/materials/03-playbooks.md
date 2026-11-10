# 03 — Playbooks, modules, and idempotency

A playbook is an ordered list of plays. A play selects hosts and defines tasks. A task calls a module or includes other automation. YAML indentation is structural: use spaces, not tabs.

```yaml
- name: Configure web machines
  hosts: web
  become: true
  tasks:
    - name: Ensure curl is installed
      ansible.builtin.apt:
        name: curl
        state: present

    - name: Ensure the application directory exists
      ansible.builtin.file:
        path: /srv/demo
        state: directory
        owner: root
        group: root
        mode: '0755'
```

Fully qualified collection names such as `ansible.builtin.copy` make module ownership clear. Quote file modes to avoid YAML number interpretation surprises.

## Module selection

| Intent | Preferred module | Why not arbitrary shell? |
|---|---|---|
| Install Ubuntu packages | `ansible.builtin.apt` | Understands package state |
| Create directories/permissions | `ansible.builtin.file` | Checks existing properties |
| Static content | `ansible.builtin.copy` | Compares content and metadata |
| Generated configuration | `ansible.builtin.template` | Renders variables and supports validation |
| Manage normal OS services | `ansible.builtin.service` / `systemd_service` | Integrates with service manager |
| Assert conditions | `ansible.builtin.assert` | Gives explicit failure semantics |
| HTTP verification | `ansible.builtin.uri` | Checks status and response content |

The lab lacks systemd. Its nginx role checks `nginx.pid`, starts nginx when absent, validates configurations, and reloads through a handler. On VMs, prefer the actual service manager and enable services on boot.

## Read the recap

```text
web1 : ok=8 changed=3 unreachable=0 failed=0 skipped=1
```

`ok` includes successfully executed tasks, including changed ones. `changed` counts tasks that report changes, not files or bytes changed. An accurate `changed_when` matters because changes trigger handlers. `failed_when` expresses domain-specific failure conditions.

## Safe workflow

```bash
docker compose exec controller ansible-playbook playbooks/01-baseline.yml --syntax-check
docker compose exec controller ansible-playbook playbooks/01-baseline.yml --list-hosts
docker compose exec controller ansible-playbook playbooks/01-baseline.yml
docker compose exec controller ansible-playbook playbooks/01-baseline.yml --check --diff
docker compose exec controller ansible-playbook playbooks/01-baseline.yml
```

This lab performs one real baseline apply first to bootstrap apt metadata and module dependencies. On an unprepared target, check mode cannot necessarily install its own prerequisites. Once the baseline exists, modify the banner and inspect its predicted diff before applying.

Check mode predicts changes only for modules that support it. It is not a sandbox or a proof of success. Commands may be skipped, registered data may be missing, and tasks explicitly using `check_mode: false` still execute. Diff mode may reveal secrets. Use check mode only on suitable tasks and with trusted inventory.

The web demo explicitly rejects check mode because its package installation, executable validation, and process checks depend on real earlier changes. Practice check mode on the baseline demo instead.

## Loops, conditionals, and registered results

```yaml
- name: Create application directories
  ansible.builtin.file:
    path: '{{ item }}'
    state: directory
    mode: '0755'
  loop:
    - /srv/demo
    - /srv/demo/releases

- name: Inspect nginx installation
  ansible.builtin.stat:
    path: /usr/sbin/nginx
  register: nginx_binary

- name: Explain installation state
  ansible.builtin.debug:
    msg: Nginx is installed
  when: nginx_binary.stat.exists
```

Conditionals contain expressions, not nested `{{ }}` delimiters. Do not use `ignore_errors: true` to hide unknown failures. Design explicit recovery for expected failures.

## Exercise

Run baseline twice and explain every nonzero changed count. Introduce an append-only shell task in a scratch playbook and contrast it with `copy`. Do not use that scratch pattern in the final role.
