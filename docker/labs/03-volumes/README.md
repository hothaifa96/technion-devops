# Lab 03: Volumes & Persistence

## Objective

Persist data across containers using named volumes, bind mounts and tmpfs.

## Prerequisites

- Read [materials/04-volumes.md](../../materials/04-volumes.md)

## Exercise

### Step 1: Prove data is ephemeral
1. Run an `alpine` container that writes a file to `/data/hello.txt`, then remove the container.
2. Run a new container and show that the file is gone.

### Step 2: Named volume + Postgres
1. Create a volume named `pg-data`.
2. Run `postgres:16-alpine` mounting `pg-data` to `/var/lib/postgresql/data`.
3. Create a table `courses(id serial, name text)` and insert 3 rows.
4. Delete the container (`docker rm -f`), start a new one with the same volume and verify the rows exist.
5. Where on the host (inside the Docker VM) is the data stored? (`docker volume inspect`)

### Step 3: Bind mount for development
1. Create a folder `site/` with an `index.html`.
2. Run `nginx:alpine` with `site/` bind-mounted **read-only** to `/usr/share/nginx/html`.
3. Edit the HTML on your machine and refresh - no rebuild needed.
4. Try to create a file inside the container in that path. What happens and why?

### Step 4: Shared volume
1. Run a `producer` container that appends the date to `/logs/app.log` every second.
2. Run a `consumer` container that tails the same file through the same volume.

### Step 5: Backup & restore
1. Back up `pg-data` to `pg-backup.tar.gz` using a throwaway `alpine` container.
2. Delete the volume, restore it from the backup into a new volume `pg-data-restored`, start Postgres on it and verify the data.

### Step 6: tmpfs
Run a container with a 16MB tmpfs at `/cache`. Try to write a 32MB file there with `dd`. What happens?

## Challenge Exercise

1. Use `--mount type=bind` with a path that does not exist. Compare to `-v` with the same path.
2. Run `alpine` as your user (`-u $(id -u):$(id -g)`) with a bind mount and create a file. Check the owner on the host. Repeat without `-u`.
3. Write a `Dockerfile` with `VOLUME /data`. Run it twice and list the anonymous volumes created. How do you avoid leaving them behind?

## Deliverables
`commands.md` + screenshots of the restored data.
