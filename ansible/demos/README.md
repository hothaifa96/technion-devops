# The Ansible classroom: 10 demos, one growing story

**The story:** you inherit three Ubuntu machines. First you discover them, then configure them, publish a website, and finally deploy a Git release one host at a time—with a health gate and rollback.

Everything uses the existing plain-Docker lab: `ansible-server`, `host1`, `host2`, and `host3`. No Docker Compose, cloud account, GitHub account, or passwords are needed after setup. Package installation requires internet; the Git exercise uses a local repository so it does not depend on an external hosting service.

## Instructor dashboard

| # | Demo | Main concepts | The moment to show students |
|---|---|---|---|
| 01 | Can I reach my fleet? | Inventory, SSH, ping, limits | Three hosts return `pong` |
| 02 | What am I managing? | Facts, command, register, debug | Same command, three different machines |
| 03 | Deliver a file | Copy, permissions, idempotency | First run changes; second run does not |
| 04 | Install the toolbox | Apt, lists, become | Git appears on every target |
| 05 | Build an app workspace | Users, groups, files, loops | Correct ownership on three hosts |
| 06 | Declare a baseline | Playbooks, vars, tags, check/diff | Preview a change before applying it |
| 07 | Give each host an identity | Jinja, facts, escaping, extra vars | One template produces three pages |
| 08 | Make it a real website | Nginx, validation, handlers, HTTP | A config change triggers a reload |
| 09 | Deploy from Git | Commits, tags, bundle, git module | Switch between real v1 and v2 commits |
| 10 | Release like an operator | Canary, serial, health gate, rescue | A bad release rolls back and stops |

Each numbered YAML file is an actual runnable playbook. Open it beside the terminal while teaching. Run the demos in order: later demos build on earlier state.

## Before class: prepare the room

### On your laptop, from the repository root

```bash
bash ansible/setup-machines.sh
docker exec ansible-server mkdir -p /root/demos
docker cp ansible/demos/. ansible-server:/root/demos/
docker exec -it ansible-server bash
```

Setup is safe to rerun for containers created by our scripts. It starts SSH, refreshes classroom SSH trust through Docker, and tests all three hosts. It refuses unrelated containers with conflicting names. It does not delete containers.

### Inside the Ansible server

```bash
cd /root/demos
export ANSIBLE_INVENTORY=/etc/ansible/demo-hosts
apt-get update
apt-get install -y --no-install-recommends curl
ansible --version
ansible-inventory --graph
```

**All remaining command blocks run inside this server unless explicitly marked otherwise.** The environment variable removes the need to repeat `-i /etc/ansible/demo-hosts` on every command. In a new server shell, export it again.

```text
Laptop
  └── Docker network: ansible-demo
       ├── ansible-server: Ansible + private SSH key
       ├── host1: SSH + Python + sudo
       ├── host2: SSH + Python + sudo
       └── host3: SSH + Python + sudo
```

The SSH user is `ansible`. `--become` uses passwordless sudo in this disposable classroom lab. Do not point this inventory at real servers.

### Your recurring teaching rhythm

1. **Predict:** ask which hosts will change and why.
2. **Run:** show the command and recap.
3. **Verify:** inspect the target independently.
4. **Repeat:** distinguish desired state from repeated actions.
5. **Challenge:** ask students to make one controlled variation.

---

## 01 · Can I reach my fleet?

**Goal:** distinguish inventory selection from connection testing.

### Live commands

```bash
ansible-inventory --graph
ansible all --list-hosts
ansible mygroup --list-hosts
ansible all -m ansible.builtin.ping
ansible all -m ansible.builtin.ping --limit host1
```

### The playbook version

Open [01-ping.yml](01-ping.yml), then run:

```bash
ansible-playbook 01-ping.yml --list-hosts
ansible-playbook 01-ping.yml
```

**Expected:** all three hosts return `"ping": "pong"`. The limited command reaches only host1. The playbook has `changed=0`.

**Say:** “Ansible ping is not ICMP. It authenticates over SSH and executes a Python module.”

**Student challenge:** target only host2 and host3 with `--limit 'host2,host3'`.

**If it fails:** on the laptop, rerun `bash ansible/setup-machines.sh`. Do not disable SSH host-key checking.

---

## 02 · What am I managing?

**Goal:** compare discovered facts, command results, and privilege escalation.

### Live commands

```bash
ansible all -m ansible.builtin.command -a hostname
ansible all -m ansible.builtin.command -a whoami
ansible all --become -m ansible.builtin.command -a whoami
ansible host1 -m ansible.builtin.setup -a 'filter=ansible_distribution*'
ansible host1 -m ansible.builtin.command -a 'uname -r'
```

### The playbook version

Open [02-discover.yml](02-discover.yml):

```bash
ansible-playbook 02-discover.yml
```

**Expected:** Ubuntu facts, three inventory identities, and the SSH identity `ansible`. The ad-hoc sudo command prints `root`.

**Say:** “`register` stores a task result; `debug` displays it. `changed_when: false` tells Ansible that reading the identity does not modify the host.”

Ad-hoc `command` normally reports changed even for `whoami`; the playbook deliberately corrects that reporting. Containers share the host kernel, so the same `uname -r` does not mean they are the same container.

**Student challenge:** add a debug task showing `ansible_facts['architecture']`.

**Important distinction:** `command` does not interpret pipes or redirection. Use `shell` only when shell syntax is genuinely needed.

---

## 03 · Deliver a file—and prove idempotency

**Goal:** copy local content and understand `changed`.

### Live commands

```bash
printf 'Hello students!\n' > /tmp/classroom-source.txt
ansible all -m ansible.builtin.copy -a 'src=/tmp/classroom-source.txt dest=/tmp/classroom-live.txt mode=0644'
ansible all -m ansible.builtin.command -a 'cat /tmp/classroom-live.txt'
ansible all -m ansible.builtin.copy -a 'src=/tmp/classroom-source.txt dest=/tmp/classroom-live.txt mode=0644'
```

**Pause before the last command:** will it change anything?

### The playbook version

Open [03-copy.yml](03-copy.yml):

```bash
ansible-playbook 03-copy.yml
ansible-playbook 03-copy.yml
```

**Expected:** the first copy changes hosts; an identical second copy does not. The playbook also reads the target file and asserts its content. On already-converged machines, the first classroom run may also report no change.

**Say:** “The source is on the controller. The destination is on each managed host. Ansible compares the desired content and metadata.”

**Student challenge:** change the source to `Hello version 2!`, copy only to host1, inspect all three hosts, then converge the entire group.

---

## 04 · Install the toolbox on every host

**Goal:** use package modules instead of shell commands.

### Live commands

```bash
ansible all --become -m ansible.builtin.apt -a 'name=git state=present update_cache=true cache_valid_time=3600'
ansible all -m ansible.builtin.command -a 'git --version'
```

### The playbook version

Open [04-packages.yml](04-packages.yml):

```bash
ansible-playbook 04-packages.yml
ansible-playbook 04-packages.yml
```

**Expected:** Git, curl, and CA certificates are installed on every target. The second run normally has zero changes; refreshing an expired apt cache can report a change.

**Say:** “`state: present` describes the state we want. `--become` grants the task permission to install packages.”

**Student challenge:** add `tree` to the package list and verify it with `tree --version`.

**If apt fails:** inspect DNS and repository connectivity; first installation needs internet. Do not replace the task with `ignore_errors`.

---

## 05 · Build an application workspace

**Goal:** combine groups, users, permissions, and loops.

### The playbook

Open [05-users-files.yml](05-users-files.yml), then run:

```bash
ansible-playbook 05-users-files.yml
ansible all -m ansible.builtin.command -a 'id classroom'
ansible all -m ansible.builtin.command -a 'ls -ld /srv/classroom /srv/classroom/data /srv/classroom/logs'
ansible all --become -m ansible.builtin.stat -a 'path=/srv/classroom/app.env'
ansible-playbook 05-users-files.yml
```

**Expected:** a non-login `classroom` user, three directories owned by that user, and a root-managed settings file with mode `0640`. The second apply reports zero changes.

**Say:** “Not every user should log in. The application owns its writable directories; root owns configuration.”

**Student challenge:** add `/srv/classroom/cache` to the loop. Predict how many tasks will report changed per host.

**Discussion:** why is `chmod 777` not a good substitute for choosing an owner and group?

---

## 06 · Declare a baseline and preview changes

**Goal:** introduce variables, tags, syntax checking, and check/diff mode.

### Validate, then apply

Open [06-baseline.yml](06-baseline.yml):

```bash
ansible-playbook 06-baseline.yml --syntax-check
ansible-playbook 06-baseline.yml --list-hosts
ansible-playbook 06-baseline.yml
ansible-playbook 06-baseline.yml
```

### Predict a different banner without applying it

```bash
ansible-playbook 06-baseline.yml --tags banner --check --diff -e 'classroom_message="Hello DevOps students"'
ansible all -m ansible.builtin.command -a 'cat /etc/ansible-classroom/banner.txt'
```

Now apply the exact same change:

```bash
ansible-playbook 06-baseline.yml --tags banner --diff -e 'classroom_message="Hello DevOps students"'
ansible all -m ansible.builtin.command -a 'cat /etc/ansible-classroom/banner.txt'
```

**Expected:** check mode shows a predicted diff but leaves the banner unchanged. The real apply changes it. A later run without the extra variable returns to the playbook's default banner.

**Say:** “Check mode is a prediction, not a transaction or a sandbox. First bootstrap the real baseline; some modules cannot predict state that depends on packages or files that do not yet exist.”

**Student challenge:** use `--tags banner --limit host3` with a different message, inspect the fleet, then converge all hosts.

**Caution:** diff can expose file content. Do not use it on secret-bearing tasks.

---

## 07 · One template, three identities

**Goal:** render variables and facts into host-specific pages.

Open [07-templates.yml](07-templates.yml) and [templates/index.html.j2](templates/index.html.j2):

```bash
ansible-playbook 07-templates.yml
ansible all -m ansible.builtin.command -a 'cat /srv/classroom-web/index.html'
```

Change only one host:

```bash
ansible-playbook 07-templates.yml --limit host1 -e release_version=v2
ansible all -m ansible.builtin.command -a 'cat /srv/classroom-web/index.html'
```

Converge the fleet back to the default:

```bash
ansible-playbook 07-templates.yml
ansible-playbook 07-templates.yml
```

**Expected:** the template is shared, but the `Host:` field differs. The limited release initially changes only host1. The final repeated run has zero changes.

**Say:** “`inventory_hostname` comes from inventory. Facts come from the target. Extra vars override our play's defaults, but they are not saved.”

**Student challenge:** change the title without editing the template:

```bash
ansible-playbook 07-templates.yml -e 'site_title="My first managed website"'
```

The HTML uses the Jinja `e` filter so variable content is escaped rather than treated as HTML.

---

## 08 · Publish the website with validation and handlers

**Prerequisite:** demo 07 has created `/srv/classroom-web/index.html` on all hosts.

**Goal:** install nginx, validate candidate configuration, start a process, and reload only on configuration changes.

Open [08-web-handlers.yml](08-web-handlers.yml) and [templates/nginx.conf.j2](templates/nginx.conf.j2):

```bash
ansible-playbook 08-web-handlers.yml
curl --fail --silent --show-error http://host1:8080/
curl --fail --silent --show-error http://host2:8080/
curl --fail --silent --show-error http://host3:8080/
ansible-playbook 08-web-handlers.yml
```

Change configuration and observe the handler:

```bash
ansible-playbook 08-web-handlers.yml -e worker_connections=512
ansible-playbook 08-web-handlers.yml -e worker_connections=512
```

**Expected:** the first configuration change notifies `Reload classroom nginx`; an identical second run does not. HTTP verification runs from the controller, not just inside the target.

### A safe configuration failure

Run this command by itself; failure is intentional:

```bash
ansible-playbook 08-web-handlers.yml --limit host1 -e worker_connections=invalid
```

Then verify the old site still works:

```bash
curl --fail --silent --show-error http://host1:8080/
ansible-playbook 08-web-handlers.yml -e worker_connections=512
```

**Say:** “The template validates a temporary candidate with `nginx -t` before replacing the managed configuration. Handlers run only when notified. Static page content changes do not need nginx reloads.”

**Container note:** we use a dedicated nginx config, PID file, and internal port 8080. These containers have no active systemd manager, so the playbook explicitly checks the process and starts it when absent. On a normal VM, use the actual service manager. This small PID check is a teaching shortcut, not a production supervisor.

There are no host-published HTTP ports. `http://host1:8080/` works from the controller; it is not your laptop's `localhost:8080`. After a container restart, rerun lab setup for SSH and this playbook for nginx.

**Student challenge:** identify which tasks report changed when only `worker_connections` changes.

---

## 09 · Deploy a real versioned Git website

**Prerequisites:** demos 04, 07, and 08. Git is installed on targets; the web root and nginx process exist.

**Goal:** understand Git commits, release tags, and reproducible deployment with the `git` module.

### Create a local teaching repository on the server

```bash
bash prepare-git.sh
git -C classroom-site log --oneline --decorate --all
git -C classroom-site show v1:index.html
git -C classroom-site show v2:index.html
git bundle verify classroom-site.bundle
```

`prepare-git.sh` creates two commits and two tags (`v1`, `v2`). A Git bundle is a portable repository archive containing Git history and refs—not a ZIP file. It uses command-scoped author identity and does not change global Git configuration. Repeating the script keeps an existing bundle rather than rewriting history.

The playbook copies this bundle to each host and uses it as a local Git remote. Students learn the real `git` module without external credentials, hosting, or GitHub availability. In a production workflow, substitute a reviewed remote URL and immutable commit IDs with properly managed authentication.

### Deploy v1 everywhere

Open [09-git-deploy.yml](09-git-deploy.yml):

```bash
ansible-playbook 09-git-deploy.yml
ansible all --become -m ansible.builtin.command -a 'git -C /opt/classroom-site log -1 --oneline'
curl --fail --silent --show-error http://host1:8080/
ansible-playbook 09-git-deploy.yml
```

### Try a canary release

```bash
ansible-playbook 09-git-deploy.yml --limit host1 -e release_version=v2
curl --fail --silent --show-error http://host1:8080/
curl --fail --silent --show-error http://host2:8080/
```

**Expected:** host1 serves `v2`; host2 and host3 still serve `v1`. The second identical full v1 deployment before the canary has zero changes.

### Restore a common starting point for demo 10

```bash
ansible-playbook 09-git-deploy.yml -e release_version=v1
```

**Say:** “The Git checkout is on the target. We publish that checked-out file with `remote_src: true`; otherwise Ansible would look for it on the controller.”

**Student challenge:** compare `git rev-parse HEAD` on two hosts after a canary.

**Ordering note:** demo 07 and demo 09 intentionally manage the same published page using different techniques. Running demo 07 again replaces the Git page with the Jinja page. For demos 09–10, use Git as the source of truth.

---

## 10 · Rolling release with a health gate and rollback

**Prerequisite:** complete demo 09 and restore every host to Git release `v1`. Keep nginx running.

**Goal:** deploy one host at a time, verify the release, restore the previous revision on failure, and preserve a failed result.

Open [10-rolling-release.yml](10-rolling-release.yml). Identify `serial`, `any_errors_fatal`, `block`, `rescue`, and `until` before running it.

### A. Successful rollout

```bash
ansible-playbook 10-rolling-release.yml -e release_version=v2
ansible all -m ansible.builtin.uri -a 'url=http://127.0.0.1:8080/ return_content=true use_proxy=false'
ansible-playbook 10-rolling-release.yml -e release_version=v2
```

**Expected:** host1 completes before host2 starts; host2 completes before host3 starts. Every HTTP body contains `v2`. A repeated deployment reports zero changes.

The playbook's HTTP gate runs from the controller using the inventory hostname. The ad-hoc verification above runs on each target using its own loopback address. Explain the difference.

### B. Deliberately fail the health gate

First restore all hosts to v1:

```bash
ansible-playbook 09-git-deploy.yml -e release_version=v1
```

Now run this command **by itself**. A nonzero exit is expected:

```bash
ansible-playbook 10-rolling-release.yml --limit host1 -e release_version=v2 -e expected_release=not-a-real-release
```

It publishes v2 but demands a body string that does not exist. After three health attempts, `rescue` restores host1's previously captured Git revision and page. The final `fail` deliberately keeps the deployment unsuccessful.

Verify the rollback and unaffected peers:

```bash
curl --fail --silent --show-error http://host1:8080/
curl --fail --silent --show-error http://host2:8080/
curl --fail --silent --show-error http://host3:8080/
ansible all --become -m ansible.builtin.command -a 'git -C /opt/classroom-site log -1 --oneline'
```

**Expected:** all three still serve v1. Host1 rolled back; host2 and host3 were excluded by the canary limit.

To demonstrate the full-play stop policy, repeat the intentionally failing command **without** `--limit host1`. On the first failed host, `any_errors_fatal` stops later serial batches. Do not rely on inventory ordering for a production canary: select the canary explicitly.

### C. Recover with a valid rollout

```bash
ansible-playbook 10-rolling-release.yml -e release_version=v2
ansible-playbook 10-rolling-release.yml -e release_version=v2
```

**Say:** “A rescued error is not automatically a failed deployment. We explicitly fail after rollback so an operator or CI system knows this release was not successful.”

**Student challenge:** deploy v1 as a valid rollback, then explain how that differs from the automatic rescue.

**Production boundary:** this restores a static file from a previous Git commit. It does not roll back databases, drain a load balancer, recover unreachable hosts, or undo a fleet-wide transaction. If rollback itself fails, execution remains failed and requires investigation.

---

## Instructor quick reference

| Intent | Command inside the controller |
|---|---|
| Select one target | `ansible all --list-hosts --limit host1` |
| Test SSH + Python | `ansible all -m ansible.builtin.ping` |
| Inspect an effective host | `ansible-inventory --host host1` |
| Read a file | `ansible all -m ansible.builtin.command -a 'cat /tmp/classroom-hello.txt'` |
| Elevate privileges | `ansible all --become -m ansible.builtin.command -a whoami` |
| Check syntax | `ansible-playbook 06-baseline.yml --syntax-check` |
| Preview a supported change | `ansible-playbook 06-baseline.yml --check --diff` |
| Select tagged tasks | `ansible-playbook 06-baseline.yml --tags banner` |
| Deploy a canary | `ansible-playbook 09-git-deploy.yml --limit host1 -e release_version=v2` |
| Diagnose an SSH failure | `ansible host1 -m ansible.builtin.ping -vvv` |

### Troubleshooting without guessing

| Symptom | What to check |
|---|---|
| Empty inventory / no matching hosts | Export `ANSIBLE_INVENTORY=/etc/ansible/demo-hosts` in this shell |
| Playbook or template not found | `cd /root/demos`; copy the entire demos directory, including templates |
| SSH connection refused after restart | Rerun `bash ansible/setup-machines.sh` on the laptop |
| SSH password prompt | Run from the controller as root; connect as `ansible`; check inventory and setup |
| HTTP connection refused | SSH setup does not start nginx; rerun demo 08 after starting SSH |
| Wrong HTTP page | Demos 07 and 09 manage the same page; rerun the intended source-of-truth demo |
| Git bundle missing | Run `bash prepare-git.sh` inside `/root/demos` on the controller |
| Git says dubious ownership | Inspect as root with `--become`; do not disable Git ownership protection globally |
| Invalid nginx input fails | Expected in demo 08; the validated old configuration remains in place |
| Rollout exits nonzero | Expected for the deliberate failing gate; inspect rollback output before retrying |

### Validate every playbook before class

Inside the controller:

```bash
for playbook in [0-9][0-9]-*.yml; do
  ansible-playbook "$playbook" --syntax-check || break
done
```

After successful real deployment, use repeated runs to prove convergence. Do not run every demo with `--check`: demo 08–10 deliberately require real process and Git state.

### End the class without deleting work

On the **laptop**:

```bash
docker stop ansible-server host1 host2 host3
```

Next class, rerun lab setup, export inventory in the server shell, and run demo 08 to start nginx again. No cleanup or container deletion is automatic.
