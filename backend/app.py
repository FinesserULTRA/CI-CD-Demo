"""Flask app entry for life-dashboard API."""
from flask import Flask

app = Flask(__name__)


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/")
def index():
    return {"app": "life-dashboard-api"}
