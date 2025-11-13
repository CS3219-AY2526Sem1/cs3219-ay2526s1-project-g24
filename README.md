[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: G24

---

## 📖 Overview

PeerPrep is a technical interview preparation and peer-matching platform where users can practice coding interview questions together in real time. It features a **microservices architecture** where each service runs independently and communicates through internal APIs.

---

## 🏗️ Architecture

| Service | Technology | Description |
|---------|-----------|-------------|
| **Frontend** | Next.js 15 | User interface with server-side rendering |
| **User Service** | Node.js + Prisma | Authentication, authorization, and user management |
| **Question Service** | FastAPI + SQLAlchemy | Question management with auto-generated helper definitions |
| **Matching Service** | Node.js + Socket.IO | Real-time user matching with Server-Sent Events |
| **Collaboration Service** | Node.js + Y.js | Real-time collaborative coding with WebSocket |
| **Code Execution Service** | FastAPI + Judge0 | Multi-language code execution and validation |

**📊 System Diagrams:** See [`docs/diagrams/`](./docs/diagrams/) for architecture and deployment diagrams.

### ✨ Key Features

- **Multi-language Support** - Python, JavaScript, Java, and C++
- **Custom Data Structures** - Auto-generated helper classes for LinkedList and TreeNode
- **Real-time Collaboration** - WebSocket-based collaborative code editing with Y.js
- **Code Execution** - Sandboxed code execution with test case validation
- **Comprehensive Testing** - 138+ passing tests with 92% code coverage
- **Smart Matching** - SSE-based real-time matching with automatic timeout handling
- **Session Management** - Auto-cleanup of ghost sessions and AFK detection

### 🚀 Deployment

- **Container Orchestration:** Kubernetes 1.30 on AWS EKS
- **Auto-scaling:** Karpenter for dynamic node provisioning
- **Infrastructure as Code:** Terraform
- **CI/CD:** GitHub Actions for automated testing and deployment
- **Container Registry:** GitHub Container Registry (GHCR)
- **Security:** Cloudflare + ALB with IP whitelisting
- **Monitoring:** Prometheus/Grafana

For deployment instructions, see the [Infrastructure Setup Guide](./infra/SETUP_GUIDE.md).

---

## 🕒 Session Management

PeerPrep automatically manages collaboration sessions to prevent resource hogging and handle disconnections:

| Timeout Type | Duration | Purpose |
|--------------|----------|---------|
| **Partner Presence Warning** | 10 seconds | Notify if partner hasn't joined |
| **Ghost Session Cleanup** | 60 seconds | Remove sessions where no users connected |
| **Solo Session Timeout** | 5 minutes | Terminate if only 1 user present |
| **Rejoin Grace Period** | 10 minutes | Allow reconnection after disconnect |
| **Inactivity Timeout (AFK)** | 30 minutes | Expire inactive sessions |
| **Cleanup Interval** | 5 minutes | Periodic stale session cleanup |

### Session States

- 🟢 **Connected** - Both users actively collaborating
- 🟡 **Connecting** - Establishing connection
- � **Error** - Connection failed
- 🟠 **Ended** - Session terminated by user or timeout

---

## 🔐 Authentication & Security

### JWT-based Authentication

All services use JWT (JSON Web Tokens) issued by the User Service:

1. **Login** - User authenticates via Google OAuth2
2. **Token Issuance** - User Service generates JWT signed with RS256
3. **Token Validation** - Services validate JWT using JWKS endpoint

**JWKS Endpoint:** `/.well-known/jwks.json`

**JWT Payload Example:**
```json
{
  "userId": "cuid298e7d6s5f4g3h2j1k0l",
  "email": "user@example.com",
  "roles": ["user"],
  "scopes": ["questions:read", "questions:create"],
  "iat": 1678886400,
  "exp": 1679491200
}
```

**Security Features:**
- Asymmetric key cryptography (RS256) - private key never leaves User Service
- Automatic key rotation support via `kid` (Key ID) field
- Service-to-service authentication using JWKS verification

For implementation details, see [User Service README](./apps/user_service/README.md) and [authentication diagrams](./docs/diagrams/).

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker Desktop installed and running
- Node.js 18+ (for local development)
- pnpm 8+ (for monorepo management)

### 1. Clone the Repository

```bash
git clone https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g24.git
cd cs3219-ay2526s1-project-g24
```

### 2. macOS Setup (Required for Judge0)

**macOS users only:** Enable cgroup v1 in Docker Desktop:

```bash
# Edit Docker settings
nano ~/Library/Group\ Containers/group.com.docker/settings.json

# Change deprecatedCgroupv1 to true
"deprecatedCgroupv1": true

# Restart Docker Desktop
```

### 3. Start All Services

```bash
# Start all services in detached mode
docker compose up -d

# First build takes 5-10 minutes (downloads dependencies and images)
```

### 4. Access the Application

| Service | Port | URL |
|---------|------|-----|
| **Frontend** | 3000 | http://localhost:3000 |
| **User Service** | 8001 | http://localhost:8001 |
| **Question Service** | 8000 | http://localhost:8000 |
| **Matching Service** | 8002 | http://localhost:8002 |
| **Collab Service** | 3003 | http://localhost:3003 |
| **Code Execution** | 3010 | http://localhost:3010 |

### 5. Verify Services

```bash
# Check all containers are running
docker ps

# View logs for specific service
docker compose logs -f web

# Access health endpoints
curl http://localhost:8000/health  # Question Service
curl http://localhost:3010/health  # Code Execution
```

### 6. Stop Services

```bash
# Stop and remove containers (keeps volumes)
docker compose down

# Remove containers and volumes (clean slate)
docker compose down -v
```

### Development Tips

```bash
# Rebuild specific service after code changes
docker compose up -d --build web

# Run pnpm commands in workspace
pnpm install
pnpm build
pnpm test

# Run individual service locally (example: web)
cd apps/web
pnpm dev
```

---

## 🔧 Troubleshooting

### Judge0 / Code Execution Issues

```bash
# 1. Check cgroup v1 (macOS only)
grep deprecatedCgroupv1 ~/Library/Group\ Containers/group.com.docker/settings.json

# 2. Verify Judge0 containers
docker ps | grep judgezero

# 3. Check logs
docker compose logs judgezero-server

# 4. Test health
curl http://localhost:3010/health
```

### Port Conflicts

```bash
# Find process using port
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Database Issues

```bash
# Check database containers
docker ps | grep db

# Restart with fresh volumes
docker compose down -v
docker compose up -d
```

---

## 📚 Documentation

- **[Infrastructure Setup](./infra/SETUP_GUIDE.md)** - Complete AWS EKS deployment guide
- **[System Diagrams](./docs/diagrams/)** - Architecture and deployment diagrams
- **[User Service](./apps/user_service/README.md)** - Authentication and user management
- **[Question Service](./apps/question_service/README.md)** - Question management and stats
- **[Matching Service](./apps/matching-service/README.md)** - Real-time user matching
- **[Collab Service](./apps/collab-service/README.md)** - Real-time collaboration
- **[Code Execution](./apps/code_execution_service/README.md)** - Code execution with Judge0
- **[Frontend](./apps/web/README.md)** - Next.js web application

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific service
cd apps/question_service
pytest

# Run with coverage
pnpm test:coverage
```

---

## 🤝 Contributing

This is an academic project for CS3219 AY2526S1. Each team member is responsible for their assigned microservice.

**Project Structure:**
```
apps/
├── web/                    # Frontend (Next.js)
├── user_service/           # Authentication
├── question_service/       # Questions
├── matching-service/       # Matching
├── collab-service/         # Collaboration
└── code_execution_service/ # Code execution

infra/
├── k8s/                    # Kubernetes manifests
├── terraform/              # Infrastructure as code
└── SETUP_GUIDE.md          # Deployment guide

docs/
└── diagrams/               # System diagrams
```

---

## 📝 License

This project is part of CS3219 coursework at the National University of Singapore.
