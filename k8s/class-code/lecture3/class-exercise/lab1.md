# Kubernetes : Deploy Frontend & Backend Application

Deploy a full-stack application on Kubernetes using:

Frontend Docker image: hothaifaz11/hack-frontend:latest
Backend Docker image: hothaifaz11/hack-backend:latest

# please create 
- Deployments
- Services
- ConfigMap
- Environment variables
- Application Architecture

Your final Kubernetes architecture should look like this:

                 User Browser
                      |
                      |
              NodePort Service
                      |
                      |
              Frontend Pods
          hothaifaz11/hack-frontend
                Port: 5173
                      |
                      |
              ClusterIP Service
                      |
                      |
              Backend Pods
          hothaifaz11/hack-backend
                Port: 5000

## Requirements
1. Create Backend Deployment

Create a Kubernetes Deployment for the backend.

Requirements:
Deployment name:
backend
Image:
hothaifaz11/hack-backend:latest
Container port:
5000
Create at least:
2 replicas

backend-deployment
        |
        |
   +---------+
   | Backend |
   | Pod     |
   +---------+

   +---------+
   | Backend |
   | Pod     |
   +---------+


2. Create Backend Service

Expose the backend using a ClusterIP Service.

Requirements:

Service name:

backend-service

Type:

ClusterIP

Port:

5000

The frontend should communicate with the backend using this service name.

Example:

http://backend-service.<namesapce>.cluster.local:5000


3. Create Frontend ConfigMap

The frontend needs the backend URL from an environment variable.

Create a ConfigMap.

Name:

frontend-config

The ConfigMap must contain:

VITE_API_URL

Example value:

VITE_API_URL=

The value must NOT be written directly inside the Deployment YAML.

It must come from the ConfigMap.

4. Create Frontend Deployment

Create a Kubernetes Deployment for the frontend.

Requirements:

Deployment name:

frontend

Image:

hothaifaz11/hack-frontend:latest

Container port:

5173

Replicas:

2

The Deployment must load environment variables from:

frontend-config

Example:

Frontend Pod
      |
      |
      reads
      |
      v

ConfigMap
VITE_API_URL
5. Create Frontend Service

Expose the frontend application.

The frontend service must be:

NodePort

Requirements:

Service name:

frontend-service

Type:

NodePort

Port:

5173


The application should be accessible from outside Kubernetes.

Example:

http://<Node-IP>:<NodePort>
