FROM python:3.12.15-alpine3.24

WORKDIR /app

COPY requirements.txt .
RUN pip3 install -r requirements.txt

COPY main.py .

CMD ["python3", "main.py"]