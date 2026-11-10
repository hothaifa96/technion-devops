FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends openssh-client bash nano && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir ansible-core==2.19.3
ENV ANSIBLE_CONFIG=/work/ansible.cfg EDITOR=nano
WORKDIR /work
CMD ["sleep", "infinity"]
