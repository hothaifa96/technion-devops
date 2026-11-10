# Lab 06 — Design a production-ready automation path

## Scenario

You operate six Ubuntu web VMs behind a load balancer. Terraform owns infrastructure. Jenkins coordinates deployment. Ansible owns host configuration. Two environments, staging and production, must have separate access boundaries.

## Deliverables

1. An architecture diagram showing Git review, Jenkins trust boundaries, secrets, inventory, SSH routing, the load balancer, and target hosts.
2. Separate environment inventories and variables, with no plaintext secrets.
3. A reusable web role with a documented variable interface and validated templates.
4. A deployment playbook with a canary, bounded batches, explicit health gates, and stop-on-failure behavior.
5. A CI design with pinned dependencies, syntax/lint checks, integration tests, an approval gate, and a shared production deployment lock.
6. A recovery runbook distinguishing config rollback, application rollback, and database recovery.

## Implementable lab extension

Within the Docker lab, add an `environment_name` variable to the page, validate it against an allow-list, and deploy it to a canary first. Add an HTTP assertion for its escaped rendered value. Prove first-run change and second-run idempotency.

Do not claim the Docker extension implements real VM boot management or load-balancer draining. For VMs, replace manual nginx process commands with `ansible.builtin.systemd_service` and test service startup after reboot in a suitable environment.

## Review rubric

| Area | Evidence |
|---|---|
| Correctness | Syntax passes; expected pages respond |
| Repeatability | Second apply has no unexpected changes |
| Safety | Limited targets, validated inputs, health gates |
| Security | No secrets in Git/logs; explicit runner trust |
| Architecture | Clear resource ownership and failure domains |
| Recovery | Tested procedure and explicit limits |

## Questions to defend

- Why is a serial deployment not automatically zero downtime?
- Why should an untrusted pull request never receive production credentials?
- What happens when a schema migration succeeds but the application deployment fails?
- How is inventory selection reviewed before approval?
- Which parts of your design remain untested by containers?
