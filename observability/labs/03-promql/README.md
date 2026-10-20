# Lab 03: PromQL Challenges

## Objective

Become fluent in PromQL: selectors, rate, aggregation, histograms, joins and prediction.

## Prerequisites

- Read [05-promql.md](../../materials/05-promql.md)
- Run [class-code/01-prometheus-basics](../../class-code/01-prometheus-basics) (shop app + node-exporter + loadgen)

## Level 1 - Selectors
1. All series of `shop_http_requests_total` with status `200`.
2. All series where endpoint starts with `/p`.
3. All non-2xx requests.
4. All metric names that start with `node_network_`.
5. The value of `shop_orders_total` 10 minutes ago.

## Level 2 - Counters & rates
6. Requests per second (total) over the last 2 minutes.
7. Requests per second **per endpoint**.
8. Total number of orders in the last 15 minutes.
9. Compare `rate` vs `irate` on a graph. When would you use each?
10. Why is `sum(rate(x[5m]))` correct and `rate(sum(x)[5m])` wrong?

## Level 3 - Aggregations
11. Top 2 endpoints by traffic.
12. Number of targets that are up per job.
13. Orders per minute per payment method.
14. The endpoint with the **lowest** traffic.

## Level 4 - Ratios & histograms
15. Error ratio (5xx / total) of the whole service, as a percentage.
16. Error ratio per endpoint.
17. p50, p90, p99 latency of `/checkout`.
18. Average latency per endpoint (`_sum` / `_count`).
19. % of requests served faster than 250ms (an SLI).
20. Availability over the last hour based on `up`.

## Level 5 - Node & advanced
21. CPU usage % per mode (user, system, iowait).
22. Free disk space in GB on `/`.
23. Will the disk be full in 7 days? (`predict_linear`)
24. Uptime of the shop app in minutes.
25. Join: RPS of the shop with the `version` label from `shop_build_info` (`group_left`).
26. Peak 1m RPS during the last 30 minutes (subquery).
27. Detect if the `shop` job disappears completely (`absent`).

## Challenge Exercise

1. Write 3 recording rules for the most used queries and rewrite the queries to use them.
2. Use the HTTP API (`/api/v1/query_range`) from a Python script to export the RPS of the last hour to CSV.

## Deliverables
`answers.md` with every query + a screenshot for 5 of them.
