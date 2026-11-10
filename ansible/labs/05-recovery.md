# Lab 05 — Controlled failure and recovery

## Goal

Observe partial failure safely on disposable targets, then recover through convergence.

## Preconditions

Both web machines are configured and verified. Work only against the lab inventory.

## Experiment A: invalid input

```bash
docker compose exec controller ansible-playbook playbooks/02-web.yml -e worker_connections=0
```

Expected: the role assertion fails on the first serial host before configuration changes. With `any_errors_fatal`, the rollout stops instead of advancing to the next host. Correct the value and rerun.

## Experiment B: process stopped

Deliberately stop the lab's web1 nginx process:

```bash
docker compose exec web1 /usr/sbin/nginx -s quit
```

Wait for shutdown, observe that verification fails, then recover:

```bash
docker compose exec controller ansible-playbook playbooks/03-verify.yml
docker compose exec controller ansible-playbook playbooks/02-web.yml --limit web1
docker compose exec controller ansible-playbook playbooks/03-verify.yml
```

The first verification command is expected to return nonzero. Continue to the recovery command manually. This is an intentional outage of a disposable training service, not an instruction for production.

## Experiment C: container restart

```bash
docker compose restart web1
docker compose exec controller ansible-playbook playbooks/02-web.yml --limit web1
```

sshd starts automatically, but nginx needs reconvergence because this container has no service manager. A normal restart preserves the container filesystem and SSH host keys. A recreation does not necessarily preserve them.

## Acceptance criteria

- You distinguish module failure, connection failure, and failed health verification.
- Recovery starts the missing process; the next run reports zero changes.
- You explain why this test does not prove load-balancer draining, regional recovery, or database rollback.

## Stretch

Write a scratch playbook using `block`, `rescue`, and `always`. Simulate a failure with `ansible.builtin.fail`, record recovery intent, and deliberately preserve failed CI status. Do not implement recovery as blanket `ignore_errors`.
