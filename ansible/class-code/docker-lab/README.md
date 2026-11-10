# Docker machines lab

One controller, two web machines, and one operations machine. All Ansible target connections use SSH. No Docker socket is mounted into the controller, no privileged containers are used, and target SSH ports are not published to the host.

## Start

From this directory:

```bash
bash bootstrap.sh
docker compose ps -a
docker compose exec controller ansible --version
docker compose exec controller ansible-inventory --graph
docker compose exec controller ansible all -m ansible.builtin.ping
```

Bootstrap builds the controller and target images, generates an SSH key once in a private volume, starts the targets, retrieves their public SSH host keys through Docker, populates controller trust, and tests all connections. The private key is never mounted on targets.

The controller uses Python 3.12 and pinned `ansible-core==2.19.3`. Targets use Ubuntu 24.04 with Python 3.12. Base image tags receive upstream updates; for immutable production builds pin reviewed image digests as well. Internet is required for Docker image pulls, apt, and pip. Build time depends on your connection.

The project has a fixed Compose name. It does not support simultaneous copies without assigning distinct project names and ports. Docker daemon access is privileged; only run this lab against a daemon you control.

## Run the demos in order

```bash
docker compose exec controller ansible-playbook playbooks/01-baseline.yml --syntax-check
docker compose exec controller ansible-playbook playbooks/01-baseline.yml
docker compose exec controller ansible-playbook playbooks/01-baseline.yml --check --diff
docker compose exec controller ansible-playbook playbooks/02-web.yml
docker compose exec controller ansible-playbook playbooks/03-verify.yml
```

Visit `http://localhost:8081` for web1 and `http://localhost:8082` for web2. HTTP verification also runs from the controller, independent of host port selection.

| Demo | Concepts | Expected result |
|---|---|---|
| `01-baseline.yml` | Facts, apt, loops, files, become | Three configured machines |
| `02-web.yml` | Role, Jinja, validation, handlers, serial deployment | Two distinct nginx pages |
| `03-verify.yml` | Delegation, HTTP checks, assertions | Each response identifies its inventory host |
| `04-vault.yml` | Vault, no_log, root-only file | Requires manual Vault exercise setup first |

## Prove idempotency

```bash
docker compose exec controller ansible-playbook playbooks/01-baseline.yml
docker compose exec controller ansible-playbook playbooks/02-web.yml
```

After convergence, expect `changed=0` for every target. A later apt cache refresh may report change after the configured cache-validity interval. The templates intentionally contain no run timestamp.

## Change a release

```bash
docker compose exec controller ansible-playbook playbooks/02-web.yml --limit web1 -e release_version=v2
docker compose exec controller ansible-playbook playbooks/02-web.yml -e release_version=v2
```

The first command is a manual canary. The second converges both hosts. An extra-var override is not persisted: a later run without it returns to the inventory's release value.

## Port conflicts

Choose alternate loopback ports before bootstrap:

```bash
export WEB1_PORT=18081
export WEB2_PORT=18082
bash bootstrap.sh
```

Keep those variables set for subsequent Compose commands, or place only these non-secret values in a local `.env` file. The defaults are 8081 and 8082. Do not bind these training services to public interfaces.

## Container limitations

sshd is PID 1; there is no systemd. Nginx is started explicitly by the role and is not automatically restarted when a target container restarts. After restarting a node, rerun the web playbook. Its process check starts nginx again. A container recreation loses installed packages and managed files, so reconverge baseline and web.

The lab validates process presence using nginx's PID file. This is intentionally simple for a controlled disposable environment, not a general-purpose production process supervisor.

## Stop and cleanup — run manually when ready

Stop without deleting containers or volumes:

```bash
docker compose stop
```

Remove lab containers and the Compose network while retaining key/trust volumes:

```bash
docker compose down
```

To intentionally discard the lab's containers, keys, and trust volumes:

```bash
docker compose down --volumes
```

The last command destroys lab volumes. Do not run it unless you want a full reset. Bind-mounted source files, including any local Vault exercise file, are not deleted by it. The next bootstrap creates new identities. This course does not run cleanup automatically.

## Verification and troubleshooting

Run the repeatable integration suite after bootstrap:

```bash
docker compose exec -T controller python verify.py
```

It checks SSH, syntax, baseline check mode, real deployment, HTTP health, second-run idempotency, rejection of invalid role input, and Vault encryption/deployment using temporary training data. It writes a training-only token on ops1 and verifies root-only permissions. Temporary encryption files and their random password are removed when the test exits normally; your interactive Vault exercise file is not read or modified. Tests reconverge the web release to the current inventory defaults.

For noninteractive CI replace `exec` with `exec -T`. Use the [troubleshooting guide](../../materials/09-troubleshooting.md). Complete the [labs](../../labs/01-connect.md) after the guided demos.
