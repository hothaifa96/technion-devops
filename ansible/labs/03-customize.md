# Lab 03 — Template a rolling web deployment

## Goal

Separate reusable behavior from host and environment data.

## Tasks

1. Run the baseline and `playbooks/02-web.yml`.
2. Open both local web pages and confirm distinct host identities.
3. Run `playbooks/03-verify.yml`.
4. Set `release_version` to `v2` using extra vars on `--limit web1`.
5. Compare the pages, then converge both web machines to v2.
6. Run again and require zero changes.
7. Change `worker_connections` to `1024` in web group vars; observe configuration validation and one reload handler per host.
8. Explain why changing only HTML does not require a reload.

## Acceptance criteria

- Operations machine is not targeted by the web play.
- A canary update initially affects only web1.
- Each machine is healthy before the next serial batch proceeds.
- The page escapes HTML variable content instead of treating it as executable markup.

## Solution commands

```bash
docker compose exec controller ansible-playbook playbooks/02-web.yml --limit web1 -e release_version=v2
docker compose exec controller ansible-playbook playbooks/02-web.yml -e release_version=v2
docker compose exec controller ansible-playbook playbooks/03-verify.yml
```

Remember that extra vars are not saved. Set the inventory release if v2 should become the new default.
