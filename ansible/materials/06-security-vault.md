# 06 — Vault and privilege boundaries

## Threat model first

Ansible can execute privileged operations across a fleet. Protect controller access, inventory changes, private keys, automation dependencies, CI approval paths, and logs. A compromised controller or trusted playbook can compromise every reachable managed host.

The lab generates its private key at runtime, keeps it out of Git and image layers, and mounts only the public-key volume on nodes. Root SSH and password SSH are disabled. Lab sudo is intentionally broad for learning; use a reviewed privilege model in production.

## Ansible Vault

Vault encrypts structured files or strings at rest. It does not provide automatic rotation, runtime isolation, authorization workflows, or protection from someone who controls the controller during execution.

From the Docker lab directory:

```bash
docker compose exec controller ansible-vault create inventory/group_vars/operations.vault.yml
docker compose exec controller ansible-vault view inventory/group_vars/operations.vault.yml
```

In the editor, enter a training-only value:

```yaml
training_token: training-value-not-a-real-secret
```

The example uses an explicit `vars_files` reference rather than automatic discovery: `operations.vault.yml` is not the normal `group_vars/operations.yml` group filename. Run:

```bash
docker compose exec controller ansible-playbook playbooks/04-vault.yml --ask-vault-pass
```

The demo writes the value only on `ops1` to `/etc/training-token`, owned by root with mode `0600`. The task has `no_log: true` and `diff: false`. It is a teaching exercise, not a recommendation to spread long-lived credentials into arbitrary files.

## Safe handling rules

- Use an interactive password prompt for this lab. Do not pass passwords in command-line extra vars or commit password files.
- Keep encrypted data separate from its decryption password. A ciphertext file plus its committed password provides no meaningful protection.
- Prefer runtime integration with a proper secret manager for production.
- `no_log` hides task output, not every possible exposure. Do not debug the secret, print it in a command, or include it in another task's error message.
- Diff mode and registered output can leak secrets. Restrict controller and artifact access.
- Store different environment secrets behind different Vault identities or access policies.
- Do not add secrets to Docker images, Compose environment blocks, or test fixtures.

The lab `.gitignore` ignores the local encrypted exercise file to avoid accidental classroom artifacts. Production teams may intentionally version encrypted Vault files after review; never version the password.

## Credential rotation

For SSH rotation, distribute the new public key while retaining a known-good access path, verify new authentication, then remove the old key. For application credentials, coordinate consumers and revocation. Encryption alone is not a rotation plan.

## Exercise

Complete [Lab 04](../labs/04-vault.md). Explain who can read the deployed file, who can decrypt the source, and why those are different boundaries.
