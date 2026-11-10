import os
import socket
import sys
from datetime import datetime
import requests

API_URL = os.getenv("API_URL", "https://jsonplaceholder.typicode.com/todos")
USER_ID = os.getenv("USER_ID", "1")


def main():
    print(f"[{datetime.now().isoformat()}] python job on {socket.gethostname()}")
    print(f"GET {API_URL}?userId={USER_ID}")

    try:
        resp = requests.get(API_URL, params={"userId": USER_ID}, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"request failed: {e}", file=sys.stderr)
        sys.exit(1)

    todos = resp.json()
    done = sum(1 for t in todos if t["completed"])
    print(f"user {USER_ID}: {done}/{len(todos)} todos completed")


if __name__ == "__main__":
    main()
