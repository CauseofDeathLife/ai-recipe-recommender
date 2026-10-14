# Running with Docker — AI Recipe Recommender

## What this does

The image is built from source in two stages: Node 22 compiles the app with Vite, then nginx serves the resulting static files. No Node.js is needed on the host, only Docker.

## Requirements

Docker Desktop (or Docker Engine): https://www.docker.com/products/docker-desktop/

## Build the image

Run from the repository root:

```bash
docker build -t ai-recipe-recommender .
```

## Optional: enable AI recipe generation

The app calls an n8n webhook to generate recipes with AI. Without it, the app uses its local fallback generator. To enable the webhook, pass its URL as a build argument:

```bash
docker build --build-arg VITE_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/generar-receta -t ai-recipe-recommender .
```

The URL is embedded in the JavaScript bundle at build time, so it is visible to anyone who loads the app.

## Run the container

```bash
docker run -d -p 8080:80 --name ai-recipe-recommender ai-recipe-recommender
```

Then open `http://localhost:8080`.

## Useful commands

| Action | Command |
|--------|---------|
| Stop the container | `docker stop ai-recipe-recommender` |
| Remove the container | `docker rm ai-recipe-recommender` |
| Remove the image | `docker rmi ai-recipe-recommender` |
| View container logs | `docker logs ai-recipe-recommender` |

## About the AI flow

The original n8n Cloud workflow is no longer active, so the public demo and any image built without the build argument use the local fallback generator. The app keeps working and responds immediately.
