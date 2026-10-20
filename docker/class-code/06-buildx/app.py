import platform

from flask import Flask

app = Flask(__name__)


@app.get("/")
def home():
    with open("/info.txt") as f:
        build_info = f.read().strip()
    return {"running_on": platform.machine(), "build": build_info}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
