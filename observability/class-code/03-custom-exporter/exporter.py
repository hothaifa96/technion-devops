"""
Custom Prometheus exporter for GitHub repositories.

Metrics are fetched on every scrape inside collect() (with a small cache to respect the API rate limit).
Run:  REPOS="prometheus/prometheus,grafana/grafana" python exporter.py
Then: curl localhost:9200/metrics
"""
import os
import time

import requests
from prometheus_client import Counter, start_http_server
from prometheus_client.core import REGISTRY, GaugeMetricFamily

REPOS = [r.strip() for r in os.getenv("REPOS", "prometheus/prometheus,grafana/grafana,kubernetes/kubernetes").split(",")]
PORT = int(os.getenv("PORT", "9200"))
CACHE_SECONDS = int(os.getenv("CACHE_SECONDS", "60"))
TOKEN = os.getenv("GITHUB_TOKEN")

API_ERRORS = Counter("github_exporter_api_errors_total", "Errors talking to the GitHub API", ["repo"])


class GitHubCollector:
    def __init__(self, repos):
        self.repos = repos
        self.cache = {}

    def fetch(self, repo):
        cached = self.cache.get(repo)
        if cached and time.time() - cached[0] < CACHE_SECONDS:
            return cached[1]
        headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}
        resp = requests.get(f"https://api.github.com/repos/{repo}", headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        self.cache[repo] = (time.time(), data)
        return data

    def collect(self):
        stars = GaugeMetricFamily("github_repo_stars", "Number of stars", labels=["repo"])
        forks = GaugeMetricFamily("github_repo_forks", "Number of forks", labels=["repo"])
        issues = GaugeMetricFamily("github_repo_open_issues", "Open issues + PRs", labels=["repo"])
        up = GaugeMetricFamily("github_repo_up", "1 if the last fetch succeeded", labels=["repo"])
        duration = GaugeMetricFamily("github_exporter_scrape_duration_seconds", "Time spent fetching all repos")

        start = time.perf_counter()
        for repo in self.repos:
            try:
                data = self.fetch(repo)
                stars.add_metric([repo], data["stargazers_count"])
                forks.add_metric([repo], data["forks_count"])
                issues.add_metric([repo], data["open_issues_count"])
                up.add_metric([repo], 1)
            except Exception:
                API_ERRORS.labels(repo=repo).inc()
                up.add_metric([repo], 0)
        duration.add_metric([], time.perf_counter() - start)

        yield from (stars, forks, issues, up, duration)


if __name__ == "__main__":
    REGISTRY.register(GitHubCollector(REPOS))
    start_http_server(PORT)
    print(f"exporter listening on :{PORT}/metrics for {REPOS}")
    while True:
        time.sleep(3600)
