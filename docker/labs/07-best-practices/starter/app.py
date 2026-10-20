import os

from flask import Flask, jsonify

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")


@app.get("/")
def home():
    return jsonify(message="I need a better Dockerfile", secret_configured=bool(app.config["SECRET_KEY"]))


@app.get("/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
