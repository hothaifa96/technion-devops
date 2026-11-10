# 04 — Variables, facts, and templates

## Variables describe differences; tasks describe behavior

Keep environment differences in inventory variables rather than duplicate playbooks. The demo uses `inventory/group_vars/all.yml` for connection settings, `group_vars/web.yml` for shared web settings, and role defaults for fallback values.

A practical precedence subset, from lower to higher priority:

1. Role defaults.
2. Inventory group variables.
3. Inventory host variables.
4. Play variables.
5. Task/block variables and runtime facts, depending on source.
6. Extra vars (`-e`) have very high precedence.

This is not the complete precedence table: role vars, include parameters, registered values, and cached facts add detail. Avoid relying on clever overrides. Inspect effective host variables and use distinct names.

```bash
docker compose exec controller ansible-inventory --host web1
docker compose exec controller ansible-playbook playbooks/02-web.yml -e release_version=v2
```

Extra vars are powerful and potentially dangerous. Validate externally supplied values, and never interpolate untrusted input into shell commands.

## Facts versus inventory names

`inventory_hostname` is the inventory identity (`web1`). `ansible_facts['hostname']` is discovered from the target. They can differ. Facts include OS family, network interfaces, memory, and Python details. Gathering facts has cost; disable it only when tasks do not require it.

```yaml
- name: Require supported operating system
  ansible.builtin.assert:
    that:
      - ansible_facts['os_family'] == 'Debian'
    fail_msg: This demo supports Debian-family targets only
```

Avoid treating gathered facts as live telemetry. They are a snapshot collected at a particular time.

## Jinja templates

The web role renders an HTML page using variables, inventory identity, and facts. Example:

```jinja2
<h1>{{ site_title | e }}</h1>
<p>Host: {{ inventory_hostname | e }}</p>
<p>Release: {{ release_version | e }}</p>
```

The `e` filter escapes HTML output. Ansible templates do not universally autoescape every output format. For JSON data prefer `to_json`; for YAML prefer `to_nice_yaml`. Do not hand-build structured data from untrusted strings.

For configuration files, use module validation when the application can validate a temporary candidate safely. The nginx demo's template uses `/usr/sbin/nginx -t -c %s`, so a malformed candidate fails before it replaces the working configuration.

## Data modeling

Represent lists as lists, not comma-separated strings:

```yaml
baseline_packages:
  - curl
  - ca-certificates
```

Use booleans rather than strings that look like booleans. YAML values such as `yes` have parser-dependent behavior; prefer `true` and `false`.

## Exercise

Set a new title in `group_vars/web.yml`, run only `--limit web1`, and inspect both pages. Predict which host will still have the old title. Then converge the entire web group. Explain why `-e site_title=...` overrides the inventory value.
