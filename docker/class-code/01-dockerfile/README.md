# Demo 01 - Dockerfile

```bash
# 1. build
docker build -t flask-demo:1.0 .

# 2. look at the layers
docker history flask-demo:1.0

# 3. run
docker run -d --name flask -p 5000:5000 flask-demo:1.0
curl localhost:5000
docker ps            # watch STATUS -> (healthy)

# 4. build arg vs env
docker build --build-arg APP_VERSION=2.0 -t flask-demo:2.0 .
docker run --rm -p 5001:5000 -e GREETING="shalom" flask-demo:2.0

# 5. show layer cache: change app.py and rebuild -> pip install is CACHED
echo "# change" >> app.py && docker build -t flask-demo:1.1 .

# 6. ENTRYPOINT vs CMD
docker build -f Dockerfile.entrypoint -t pinger .
docker run --rm pinger
docker run --rm pinger 8.8.8.8

# cleanup
docker rm -f flask
```
