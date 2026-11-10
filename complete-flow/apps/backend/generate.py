"""Data generator - run by the CronJob every hour. Inserts ROWS random orders."""
import json
import os
import random
import sys

import psycopg2

from app import DB

CUSTOMERS = ["alice", "bob", "carol", "dave", "eve", "frank", "grace", "heidi"]
PRODUCTS = {"keyboard": 49.9, "mouse": 19.9, "monitor": 199.0, "laptop": 999.0, "headset": 79.0, "webcam": 59.0}

rows = int(os.getenv("ROWS", "25"))
batch = []
for _ in range(rows):
    product = random.choice(list(PRODUCTS))
    batch.append((random.choice(CUSTOMERS), product, round(PRODUCTS[product] * random.uniform(0.8, 1.2), 2)))

with psycopg2.connect(**DB) as conn, conn.cursor() as cur:
    cur.executemany("INSERT INTO orders (customer, product, amount, source) VALUES (%s, %s, %s, 'generator')", batch)
    cur.execute("SELECT count(*) FROM orders")
    total = cur.fetchone()[0]

print(json.dumps({"level": "INFO", "msg": "generated orders", "inserted": rows, "total": total}))
sys.stdout.flush()
