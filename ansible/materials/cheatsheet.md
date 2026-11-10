# Ansible cheatsheet

Run from `ansible/class-code/docker-lab`. Prefix all Ansible commands with `docker compose exec controller`.

| Task | Command |
|---|---|
| Build/start and establish SSH trust | `bash bootstrap.sh` |
| Show inventory | `ansible-inventory --graph` |
| Show effective host data | `ansible-inventory --host web1` |
| Test SSH + Python | `ansible all -m ansible.builtin.ping` |
| Gather facts | `ansible web1 -m ansible.builtin.setup` |
| Run a command | `ansible all -m ansible.builtin.command -a 'id'` |
| Run with sudo | `ansible all -b -m ansible.builtin.command -a 'id'` |
| Validate syntax | `ansible-playbook playbooks/02-web.yml --syntax-check` |
| List targets | `ansible-playbook playbooks/02-web.yml --list-hosts` |
| Predict supported baseline changes | `ansible-playbook playbooks/01-baseline.yml --check --diff` |
| Apply baseline | `ansible-playbook playbooks/01-baseline.yml` |
| Deploy web role | `ansible-playbook playbooks/02-web.yml` |
| Canary scope | `ansible-playbook playbooks/02-web.yml --limit web1` |
| Override release | `ansible-playbook playbooks/02-web.yml -e release_version=v2` |
| Verify web pages | `ansible-playbook playbooks/03-verify.yml` |
| Vault exercise | `ansible-playbook playbooks/04-vault.yml --ask-vault-pass` |
| Module documentation | `ansible-doc ansible.builtin.template` |
| Changed configuration | `ansible-config dump --only-changed` |

## Important distinctions

- `hosts` selects targets; `--limit` narrows them.
- `ansible_user` is the login identity; `become` escalates privileges.
- `register` records a task result; facts describe host information.
- `changed_when` controls change reporting; `failed_when` controls failure reporting.
- `notify` schedules handlers; `meta: flush_handlers` runs queued handlers now.
- `serial` controls batches; `forks` controls parallel execution capacity.
- `--check` is a prediction, not a transactional dry run.
- Vault encrypts source data at rest; `no_log` suppresses task output.
- Containers are not VMs; use real service-manager modules on actual VMs.
