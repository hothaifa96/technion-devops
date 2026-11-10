# Ansible demo — two machines with plain Docker

**Teaching the four-machine lab?** Start with the [10-demo instructor runbook](demos/README.md): ping, discovery, copy, packages, users, playbooks, templates, nginx handlers, Git deployment, and rolling releases with rollback. It uses `setup-machines.sh` and includes runnable playbooks for `ansible-server` plus `host1`, `host2`, and `host3`.

Build an Ansible controller (server) and one managed node (client), step by step. Use two terminals so students can see which machine runs each command. No Docker Compose, Dockerfiles, host Ansible installation, or privileged containers are needed.

Prerequisites: Docker Engine/Desktop running, internet access, and two terminals. These are disposable Ubuntu training machines, not production servers. Do not reuse training passwords or sudo settings on real machines.

## 1. Host — create a network

Run on your laptop:

```bash
docker network create mynet
```

Docker's user-defined network lets the containers reach each other by name. We will use `ansible-client` instead of a changing container IP.

## 2. Terminal 1 — create the server

Run on your laptop:

```bash
docker run -it --name ansible-server --hostname ansible-server --network mynet ubuntu:24.04 bash
```

This terminal is now inside the controller as root. Leave it open while preparing the client in terminal 2.

## 3. Terminal 2 — create the client

Open another terminal on your laptop:

```bash
docker run -it --name ansible-client --hostname ansible-client --network mynet ubuntu:24.04 bash
```

This terminal is now inside the managed node as root. SSH does not need `--privileged`, and we do not publish its port to the laptop.

## 4. Client — install and start SSH

In **terminal 2**, inside the client:

```bash
apt-get update
apt-get install -y openssh-server iproute2 sudo nano python3
service ssh start
service ssh status
ip a
```

Python is required by most Ansible Linux modules. `ip a` shows the container's address; students can identify it on `eth0`. We will connect using `ansible-client`, so there is no need to copy that address into the inventory.

If package installation asks for a timezone, select the appropriate region and city (for example, Asia → Jerusalem). An OS upgrade is not required for this demo.

## 5. Client — create an SSH user with sudo

Still in **terminal 2**:

```bash
adduser itay
usermod -aG sudo itay
groups itay
```

Choose a temporary classroom password when prompted. The user is a regular user with sudo access, not another root account. The groups output should include `itay` and `sudo`.

For this isolated demo, allow only this user to run sudo without a password:

```bash
EDITOR=nano visudo -f /etc/sudoers.d/itay
```

Enter this single line, save with Ctrl+O then Enter, and exit with Ctrl+X:

```sudoers
itay ALL=(ALL:ALL) NOPASSWD: ALL
```

Then validate:

```bash
chmod 0440 /etc/sudoers.d/itay
visudo -c
```

`visudo` is included in the `sudo` package; there is no separate `visudo` package to install. We do not change sudo rules for every member of the sudo group. Passwordless sudo is a lab convenience only.

## 6. Server — install the controller tools

Return to **terminal 1**, inside the server:

```bash
apt-get update
apt-get install -y ansible openssh-client iputils-ping nano
ping -c 3 ansible-client
```

This ping checks network connectivity using ICMP. The Ansible ping module later checks SSH authentication and Python execution instead.

## 7. Server — create and copy an SSH key

Still in **terminal 1**:

```bash
ssh-keygen -t ed25519
```

Accept the default path. For this disposable lab, leave the passphrase empty by pressing Enter twice. For real automation, use an appropriate protected credential workflow.

Display only the **public** key:

```bash
cat /root/.ssh/id_ed25519.pub
```

Before the first SSH connection, display the client's SSH host-key fingerprint in **terminal 2**:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Back in **terminal 1**, install the controller's public key on the client:

```bash
ssh-copy-id -i /root/.ssh/id_ed25519.pub itay@ansible-client
```

Compare the ED25519 fingerprint in the SSH prompt with the one displayed on the client. If they match, type `yes`, then enter the temporary password chosen for `itay`.

Test key-based login and sudo:

```bash
ssh itay@ansible-client 'whoami'
ssh itay@ansible-client 'sudo -n whoami'
```

Expected results: `itay`, then `root`, without another password prompt. Never print or copy `/root/.ssh/id_ed25519`: that is the private key.

## 8. Server — create an inventory

In **terminal 1**:

```bash
mkdir -p /etc/ansible
nano /etc/ansible/hosts
```

Enter and save:

```ini
[mygroup]
ansible-client ansible_python_interpreter=/usr/bin/python3
```

Inspect the inventory:

```bash
ansible-inventory -i /etc/ansible/hosts --graph
```

`mygroup` is the inventory group. `ansible-client` is the target's Docker DNS name. The explicit inventory path makes it clear which file Ansible reads.

## 9. Server — run Ansible ping

In **terminal 1**:

```bash
ansible all -i /etc/ansible/hosts -m ansible.builtin.ping -u itay
```

Expected output includes:

```text
ansible-client | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

Compare normal execution with privilege escalation:

```bash
ansible mygroup -i /etc/ansible/hosts -m ansible.builtin.command -a 'id' -u itay
ansible mygroup -i /etc/ansible/hosts -m ansible.builtin.command -a 'id' -u itay --become
```

The first command runs as `itay`; the second runs as root using sudo.

## 10. Server — copy a file to the client

In **terminal 1**:

```bash
cd /tmp
echo hi > hello.txt
ansible mygroup -i /etc/ansible/hosts -m ansible.builtin.copy -a 'src=/tmp/hello.txt dest=/tmp/hello.txt mode=0644' -u itay
```

In **terminal 2**, verify the result on the client:

```bash
cat /tmp/hello.txt
ls -l /tmp/hello.txt
```

Expected content: `hi`.

Run the same Ansible copy command again in terminal 1. The first run should report `changed`; the second should report `SUCCESS` with `changed: false`. This demonstrates idempotency: the destination already matches the desired state.

## Reopen or restart the demo

Keep the original shells open during the lesson. To open an additional shell from your laptop:

```bash
docker exec -it ansible-server bash
docker exec -it ansible-client bash
```

If you exit the original Bash shell, its container stops. From the laptop, start stopped containers and reopen shells:

```bash
docker start ansible-server ansible-client
docker exec -it ansible-server bash
```

In a separate laptop terminal, restart SSH on the client and open its shell:

```bash
docker exec ansible-client service ssh start
docker exec -it ansible-client bash
```

These containers have no systemd service manager. Restart SSH after a container restart. Existing container files and user keys survive a stop/start, but not container deletion.

## Stop and cleanup — manually, when ready

On your laptop, stop without deleting your work:

```bash
docker stop ansible-server ansible-client
```

Only when you intentionally want to delete both training machines and their files:

```bash
docker rm ansible-server ansible-client
docker network rm mynet
```

These cleanup commands are for the instructor to run manually. Do not remove a network used by other exercises.

## Teaching checkpoints

- Which container runs Ansible, and which runs SSH and Python?
- Why does the controller need the private key while the client receives only the public key?
- How does ICMP ping differ from Ansible ping?
- What does `--become` change?
- Why does copying the same file a second time report no change?

For later lessons, see [playbooks](materials/03-playbooks.md), [variables and templates](materials/04-variables-templates.md), and [roles and handlers](materials/05-roles-handlers.md). Their runnable examples belong to the separate [advanced multi-node lab](class-code/docker-lab/README.md), which currently uses Docker Compose; they are not setup steps for this manual demo.
