# Demo 05 - Pushgateway for batch jobs

```bash
docker compose up -d
pip install prometheus-client
for i in 1 2 3; do python batch_job.py; sleep 5; done
open http://localhost:9091            # pushgateway UI

# push from bash
echo "deploy_count 7" | curl --data-binary @- http://localhost:9091/metrics/job/deployer/instance/jenkins
# delete a group
curl -X DELETE http://localhost:9091/metrics/job/deployer/instance/jenkins
```

```promql
backup_duration_seconds
time() - backup_last_success_timestamp_seconds > 86400      # no successful backup in 24h
push_time_seconds
```

Also see the Kubernetes CronJob traffic generator: [../../traffic-gen/cronjob.yaml](../../traffic-gen/cronjob.yaml)
