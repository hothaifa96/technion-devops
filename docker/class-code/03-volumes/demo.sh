#!/usr/bin/env bash
# Demo 03 - Volumes. Run line by line in class.

# 1. Data is lost without a volume
docker run --name temp alpine sh -c 'echo important > /data.txt'
docker rm temp
docker run --rm alpine cat /data.txt          # No such file

# 2. Named volume survives container removal
docker volume create notes
docker run --rm -v notes:/data alpine sh -c 'echo "note 1" >> /data/notes.txt'
docker run --rm -v notes:/data alpine sh -c 'echo "note 2" >> /data/notes.txt'
docker run --rm -v notes:/data alpine cat /data/notes.txt
docker volume inspect notes

# 3. Database persistence
docker run -d --name pg -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data postgres:16-alpine
sleep 5
docker exec pg psql -U postgres -c "CREATE TABLE students(name text); INSERT INTO students VALUES ('dana');"
docker rm -f pg
docker run -d --name pg -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data postgres:16-alpine
sleep 5
docker exec pg psql -U postgres -c "SELECT * FROM students;"   # still there!

# 4. Bind mount - live edit
mkdir -p site && echo "<h1>v1</h1>" > site/index.html
docker run -d --name site -p 8081:80 -v "$(pwd)/site:/usr/share/nginx/html:ro" nginx:alpine
curl localhost:8081
echo "<h1>v2 - edited on host</h1>" > site/index.html
curl localhost:8081

# 5. Sharing a volume between two containers
docker run -d --name writer -v shared:/data alpine sh -c 'while true; do date >> /data/log; sleep 1; done'
docker run --rm -v shared:/data alpine tail -n 3 /data/log

# 6. tmpfs
docker run --rm --tmpfs /scratch alpine sh -c 'df -h /scratch'

# 7. backup a volume
docker run --rm -v notes:/src -v "$(pwd)":/backup alpine tar czf /backup/notes.tgz -C /src .
ls -lh notes.tgz

# cleanup
docker rm -f pg site writer
docker volume rm notes pgdata shared
rm -rf site notes.tgz
