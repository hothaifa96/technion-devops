"""
A short-lived "backup" batch job that pushes its metrics to the Pushgateway before exiting.
Run:  PUSHGATEWAY=localhost:9091 python batch_job.py
"""
import os
import random
import time

from prometheus_client import CollectorRegistry, Counter, Gauge, push_to_gateway

PUSHGATEWAY = os.getenv("PUSHGATEWAY", "localhost:9091")
registry = CollectorRegistry()

duration = Gauge("backup_duration_seconds", "Duration of the last backup", registry=registry)
last_success = Gauge("backup_last_success_timestamp_seconds", "Last successful backup", registry=registry)
size = Gauge("backup_size_bytes", "Size of the last backup", registry=registry)
records = Counter("backup_records_processed_total", "Records processed in the last run", registry=registry)

with duration.time():
    n = random.randint(1000, 5000)
    time.sleep(random.uniform(1, 3))
    records.inc(n)
    size.set(n * 1024)
    failed = random.random() < 0.2

if not failed:
    last_success.set_to_current_time()

push_to_gateway(PUSHGATEWAY, job="nightly-backup", grouping_key={"db": "orders"}, registry=registry)
print(f"pushed metrics (failed={failed}, records={n})")
