FROM ubuntu
RUN apt-get update
RUN apt-get install -y python3 python3-pip curl wget vim git build-essential net-tools
ADD . /app
WORKDIR /app
RUN pip3 install --break-system-packages -r requirements.txt
ENV SECRET_KEY=my-super-secret-key-123
EXPOSE 5000
CMD python3 app.py
