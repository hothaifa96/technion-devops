# 09 — Troubleshooting guide

Run commands from `ansible/class-code/docker-lab`.

| Symptom | Diagnose | Likely resolution |
|---|---|---|
| Cannot connect to Docker | `docker info` | Start Docker Desktop/Engine; check selected context |
| A published HTTP port is busy | `docker compose ps` and host listener tools | Set `WEB1_PORT=18081 WEB2_PORT=18082 bash bootstrap.sh`; keep the same values for later Compose operations |
| SSH host-key mismatch | Check whether target was intentionally recreated | If expected, rerun bootstrap to refresh lab trust from Docker; never blindly disable verification |
| Permission denied (publickey) | `docker compose logs keygen web1`; inspect volume configuration | Ensure key generation completed and nodes mounted public keys |
| Module cannot find Python | `ansible all -m raw -a 'command -v python3'` | Ensure target image has Python; configure its actual path |
| Writing `/etc` fails | Compare `ansible all -a id` with `ansible all -b -a id` | Use become for privileged tasks and inspect sudo policy |
| Web page unavailable | Run the verify play, inspect `docker compose logs web1`, and `nginx -t` inside the node | Apply web role; inspect nginx config and listening socket |
| Every run changes | Use `--diff`, inspect command tasks and generated timestamps | Remove unstable template content; fix changed detection |
| Undefined variable | `ansible-inventory --host web1` and inspect group naming | Check scope, spelling, variable file paths, and role defaults |
| Handler not running | Was the notifying task changed? Did a later task fail? | Fix task state and explicitly flush before dependent checks |
| Check mode rejected by web play | Read its preflight assertion | Use baseline for check-mode exercises; web integration requires real package/process state |
| Vault password required | Confirm Vault exercise file exists | Use `--ask-vault-pass`; never paste its password into tracked config |
| Package mirrors unavailable | Inspect network/DNS and apt output | Retry after connectivity is restored; first installation needs network access |

Useful commands:

```bash
docker compose ps -a
docker compose logs --tail 100
docker compose exec controller ansible --version
docker compose exec controller ansible-config dump --only-changed
docker compose exec controller ansible web1 -m ansible.builtin.ping -vvv
docker compose exec web1 /usr/sbin/nginx -t
docker compose exec controller ansible-playbook playbooks/03-verify.yml
```

Verbose output can contain sensitive connection details or module arguments. Redact before sharing. The controller is the right place for Ansible commands; the target is the right place to inspect the actual service state.

Do not delete state or volumes as a first debugging step. Understand whether you are resetting keys, host trust, installed packages, or only process state.
