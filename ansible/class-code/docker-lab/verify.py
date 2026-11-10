import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import tempfile


def run(*args, expected=0):
    result = subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    print(result.stdout, end='')
    if result.returncode != expected:
        raise RuntimeError(f'{args[0]} exited {result.returncode}, expected {expected}')
    return result.stdout


def play(name, *args):
    return run('ansible-playbook', f'playbooks/{name}.yml', *args)


def require_unchanged(output, hosts):
    for host in hosts:
        pattern = rf'^{re.escape(host)}\s+:.*changed=0\s+unreachable=0\s+failed=0'
        if not re.search(pattern, output, re.MULTILINE):
            raise AssertionError(f'Expected unchanged successful recap for {host}')


os.chdir('/work')
run('ansible', 'all', '-m', 'ansible.builtin.ping')
for name in ('01-baseline', '02-web', '03-verify'):
    play(name, '--syntax-check')
play('01-baseline')
play('01-baseline', '--check', '--diff')
play('02-web')
require_unchanged(play('01-baseline'), ('web1', 'web2', 'ops1'))
require_unchanged(play('02-web'), ('web1', 'web2'))
play('03-verify')
result = subprocess.run(
    ['ansible-playbook', 'playbooks/02-web.yml', '-e', 'worker_connections=0'],
    text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
)
if result.returncode == 0 or 'Validate role inputs' not in result.stdout:
    raise AssertionError('Invalid role input was not rejected')
print('PASS: invalid worker_connections rejected')
with tempfile.TemporaryDirectory(prefix='ansible-training-') as directory:
    base = Path(directory)
    password = base / 'password'
    password.write_text(secrets.token_urlsafe(32))
    password.chmod(0o600)
    encrypted = base / 'secret.yml'
    encrypted.write_text(json.dumps({'training_token': 'automated-training-value-not-a-real-secret'}))
    encrypted.chmod(0o600)
    run('ansible-vault', 'encrypt', str(encrypted), '--vault-password-file', str(password))
    source = Path('playbooks/04-vault.yml').read_text()
    source = source.replace('../inventory/group_vars/operations.vault.yml', str(encrypted))
    temporary_play = base / 'vault-play.yml'
    temporary_play.write_text(source)
    run('ansible-playbook', str(temporary_play), '--vault-password-file', str(password), '--syntax-check')
    run('ansible-playbook', str(temporary_play), '--vault-password-file', str(password))
    output = run('ansible-playbook', str(temporary_play), '--vault-password-file', str(password))
    require_unchanged(output, ('ops1',))
metadata = run('ansible', 'operations', '-b', '-m', 'ansible.builtin.command', '-a', 'stat -c %a:%U:%G /etc/training-token')
if not re.search(r'^600:root:root$', metadata, re.MULTILINE):
    raise AssertionError('Training token permissions are not root-only')
print('PASS: SSH, syntax, baseline check mode, deployment, health, idempotency, input rejection, and temporary Vault integration')
