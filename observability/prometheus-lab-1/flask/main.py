from flask import Flask, jsonify,request
from prometheus_client import Counter , generate_latest,CONTENT_TYPE_LATEST

app = Flask(__name__)

TOTAL_REQUESTS= Counter(
    'flask_http_request_total',
    'total http requests in flask app',
    labelnames=["method","status",'endpoint']
        )


@app.get('/')
def home():
    return jsonify({'status': 'up'})


@app.get('/food')
def food():
    return jsonify({'fav_food':'pizza'})

@app.after_request
def record_metrics(response):
    endpoint_path = str(request.url_rule) if request.url_rule else "un-matched"
    TOTAL_REQUESTS.labels(
        method= request.method,
        status= response.status_code,
        endpoint= endpoint_path
    ).inc()
    return response

@app.get('/metrics')
def generate_metrics():
    return generate_latest(),200,{
        'Content-Type': CONTENT_TYPE_LATEST
    }


if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')
