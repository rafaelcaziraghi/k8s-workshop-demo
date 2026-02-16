# K3s Workshop Demo

A demo application for the Kubernetes deployment workshop at `container.dev.local`.

**Tech stack:** SAP CAP (Node.js) + OpenUI5

## Quick Start (Local)

```bash
npm install
npm run dev
# Open http://localhost:4004
```

## Deploy to Cluster

See [WORKSHOP.md](./WORKSHOP.md) for the full step-by-step guide.

> **Important:** Replace `<yourname>` with your first and last name (lowercase, no spaces) in all commands and YAML files so each participant has a unique deployment.

## Git Workflow

```bash
git checkout -b workshop/<yourname>
# ... work through the workshop ...
git add . && git commit -m "feat: workshop complete"
git push origin workshop/<yourname>
```

## Project Structure

```
k8s-workshop-demo/
├── srv/
│   ├── server.js                     # Custom CAP server with API routes
│   └── workshop-service.cds          # CDS service definition
├── app/
│   ├── index.html                    # OpenUI5 dashboard
│   └── bot.html                      # n8n embedded chat bot
├── db/
│   └── schema.cds                    # CDS data model
├── k8s/
│   ├── step1-basic.yaml              # Basic deployment (no database)
│   ├── step2-with-database.yaml      # + PostgreSQL connection + Secret
│   └── step3-full.yaml               # + proxy, internal services, bot
├── Dockerfile                        # Multi-stage build
├── .dockerignore
├── .cdsrc.json                       # CDS configuration
├── package.json
├── WORKSHOP.md                       # Full workshop guide
└── README.md
```

## Features Demonstrated

- **SAP CAP** custom server with Express middleware
- **OpenUI5** dashboard (sap_horizon theme)
- Health check endpoints (K8s liveness/readiness probes)
- PostgreSQL database connectivity (cross-namespace via K8s DNS)
- Internal K8s service communication (DNS resolution)
- External API calls via corporate proxy (undici ProxyAgent)
- **n8n embedded bot** chat page
- Environment variable configuration (Secrets + env vars)
- Live updates via Rancher UI
- Per-developer unique deployments (unique subdomain per person)
