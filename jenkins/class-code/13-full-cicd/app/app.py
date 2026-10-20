import os
import random

from flask import Flask, jsonify

app = Flask(__name__)

JOKES = [
    "Chuck Norris can kubectl delete namespace kube-system and the cluster apologizes.",
    "Chuck Norris doesn't need CI. His code integrates itself.",
    "Chuck Norris's Docker images have zero layers. They are just Chuck.",
]


@app.get("/")
def joke():
    return jsonify(joke=random.choice(JOKES), version=os.getenv("APP_VERSION", "dev"))


@app.get("/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
