# Lab 04 — Handle a training secret safely

## Goal

Distinguish encrypted source storage, task-output suppression, and target permissions.

## Tasks

1. Read [security and Vault](../materials/06-security-vault.md).
2. Create the encrypted exercise file interactively:

```bash
docker compose exec controller ansible-vault create inventory/group_vars/operations.vault.yml
```

Enter `training_token: training-value-not-a-real-secret` in the editor. Choose a training-only Vault password and retain it privately.

3. Run the protected deployment:

```bash
docker compose exec controller ansible-playbook playbooks/04-vault.yml --ask-vault-pass
```

4. Verify metadata without displaying the value:

```bash
docker compose exec controller ansible operations -b -m ansible.builtin.stat -a 'path=/etc/training-token'
```

5. Rerun the playbook and check convergence.
6. Confirm the encrypted exercise file is ignored by Git and no password file was created.

## Acceptance criteria

- Only ops1 receives `/etc/training-token`.
- The file is owned by root and has mode `0600`.
- The copy task does not expose its content through logs or diffs.
- You can explain why Vault does not protect plaintext in process memory or on the target.

## Hint

Do not solve an undefined secret by placing plaintext in `group_vars/all.yml`. The playbook intentionally loads the encrypted file through `vars_files`. Never use real production secrets in this exercise.
