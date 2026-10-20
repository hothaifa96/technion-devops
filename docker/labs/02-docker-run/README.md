# Lab 02: docker run & Container Lifecycle

## Objective

Master the `docker run` flags and day-to-day container management commands.

## Prerequisites

- Read [materials/03-docker-run.md](../../materials/03-docker-run.md)

## Exercise

### Step 1: Basics
1. Run `hello-world`. What did Docker do (pull, create, start)?
2. Run an `nginx:alpine` container in the background named `web`, published on port `8080`. Open it in the browser.
3. List running containers, then all containers.

### Step 2: Inspect & debug
1. Show the last 20 log lines of `web` and follow them while refreshing the browser.
2. Open a shell inside `web` and replace `/usr/share/nginx/html/index.html` with your name. Refresh the browser.
3. Using `docker inspect -f`, print the container IP address and its start time.
4. Copy `/etc/nginx/conf.d/default.conf` from the container to your machine.

### Step 3: Environment variables
1. Run `mysql:8` with the required env variables (`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=school`) in the background.
2. Move the variables into a `mysql.env` file and run again using `--env-file`.
3. Connect with `docker exec -it <name> mysql -uroot -p` and run `SHOW DATABASES;`

### Step 4: Restart policies
1. Run `alpine sh -c "sleep 3; exit 1"` with `--restart on-failure:3`. After 20s, what is the restart count?
2. Run the same with `--restart always`. Stop it with `docker stop`. Does it restart? Restart the Docker daemon (or Docker Desktop) - what happens?

### Step 5: Resources
1. Run a container limited to `64m` memory and `0.5` CPU.
2. Check the limits with `docker stats --no-stream`.
3. Trigger an OOM kill (hint: `python -c "x=' '*500_000_000"`). What exit code did you get? Find `OOMKilled` in `docker inspect`.

### Step 6: Cleanup
Remove all stopped containers with one command, then all unused images.

## Challenge Exercise

1. Run a container that is automatically removed when it exits and prints the current date in UTC.
2. Run `nginx` bound only to `127.0.0.1:9090`. Prove it is not reachable from another machine / IP.
3. Explain the difference between `docker stop` and `docker kill` and what exit codes 137 and 143 mean.

## Deliverables
`commands.md` with every command you used + answers.
