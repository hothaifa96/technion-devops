FROM python:3.13.14-alpine3.23

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

ENV VOLUME_PATH=/app/data

EXPOSE 5000

CMD ["python3","app.py"]