import os
import random

from flask import Flask, jsonify

app = Flask(__name__)

QUOTES = [
    "It works on my machine. - every developer",
    "Automate everything. - DevOps proverb",
    "You build it, you run it. - Werner Vogels",
    "If it hurts, do it more often. - Jez Humble",
]


@app.get("/quote")
def quote():
    return jsonify(quote=random.choice(QUOTES))


@app.get("/version")
def version():
    return jsonify(version=os.getenv("APP_VERSION", "unknown"))


@app.get("/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
