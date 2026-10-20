# Lab 04: Docker Networks

## Objective

Connect multiple containers with user-defined networks and understand DNS, isolation and port publishing.

## Prerequisites

- Read [materials/05-networks.md](../../materials/05-networks.md)

## Exercise

### Step 1: Explore
1. List networks. Which 3 exist by default?
2. Inspect the `bridge` network. What is its subnet and gateway?

### Step 2: Default bridge limitations
1. Run two `alpine` containers (`sleep 3600`) on the default network.
2. Try to ping one from the other **by name**, then **by IP**. Explain.

### Step 3: WordPress + MySQL on a custom network
1. Create a network `wp-net`.
2. Run `mysql:8` named `wp-db` on `wp-net` **without publishing any port**, with env: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=wordpress`, `MYSQL_USER=wp`, `MYSQL_PASSWORD=wp`.
3. Run `wordpress` on `wp-net` published on port `8080` with `WORDPRESS_DB_HOST=wp-db`, `WORDPRESS_DB_USER`, `WORDPRESS_DB_PASSWORD`, `WORDPRESS_DB_NAME`.
4. Finish the WordPress installation in the browser.
5. Why didn't MySQL need `-p`?

### Step 4: Isolation
1. Create a second network `other-net` and run a container on it.
2. Show it cannot reach `wp-db`.
3. Connect it to `wp-net` while running and show it now can (`nc -zv wp-db 3306`).

### Step 5: Load-balancing with aliases
1. Run 3 `traefik/whoami` containers on `wp-net` with the same `--network-alias whoami`.
2. From a `curlimages/curl` container, call `http://whoami` 6 times. What do you observe?

### Step 6: Debug
Use `nicolaka/netshoot` attached to `wp-net` to run `dig wp-db` and `nslookup whoami`.

## Challenge Exercise

1. Create a network with a custom subnet `172.30.0.0/24` and run a container with a static IP `172.30.0.50`.
2. Run a container with `--network none`. What interfaces exist?
3. Draw a diagram (ASCII or draw.io) of the WordPress setup: host, ports, network, containers, volumes.

## Deliverables
`commands.md`, diagram, answers.
