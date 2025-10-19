[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: Gxx
---
## Overview
PeerPrep is a technical interview preparation and peer-matching platform where users can practice coding interview questions together in real time.
It is built using a **microservices architecture**, where each service runs independently and communicates through internal APIs.
---
## Architecture
| Service | Description |
|----------|-------------|
| User Service | Manages user accounts and authentication |
| Matching Service | Matches users based on chosen topic and difficulty |
| Question Service | Stores and retrieves coding questions |
| Collaboration Service | Enables real-time collaborative coding sessions |
| Frontend | Provides the user interface for accessing PeerPrep |
Each microservice is located in its own folder within this repository.
---
## Setup Instructions
### 1. Clone the repository
git clone https://github.com/CS3219-AY2526S1/cs3219-ay2526s1-project-Gxx.git
cd cs3219-ay2526s1-project-Gxx

### 2. Environment Variables
Create a single .env file in the project root directory containing all environment variables for all services.
For now, only the Question Service requires an environment variable:

# .env
QUESTION_DB_PASSWORD={whatever password you want}

As the other services are completed, additional environment variables will be added to this file.
Each team member should document the required variables for their service in its README or setup notes.
Important: Do not commit the .env file to the repository. It should be ignored in .gitignore.

### 3. Running the project locally
This project uses a two-file Docker Compose setup for flexibility between environments.
- `docker-compose.yml`: The base configuration, defines all services, networks, and volumes.
- `docker-compose.local.yml`: An override file for local development that tells Docker Compose to build service images from local source code.

To build and start all services for local development, run the following command:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```
This command merges the two configuration files, builds the images, and starts the containers in detached mode.

### 4. Port Mappings
The following ports are used by the services on `localhost`:

| Service | Port | URL |
| :--- | :--- | :--- |
| `question_service` | `8000` | http://localhost:8000 |
| `user_service` | `8001` | http://localhost:8001 |
| `question_db` | `5434` | (for direct DB access) |
| `user_db` | `5433` | (for direct DB access) |

Please ensure these ports are not in use by other applications on your machine.

### 5. Stopping the project
To stop and remove all containers, networks, and volumes created by the local setup:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
```

### 6. Verifying services
Check that all containers are running:
```bash
docker ps
```
View logs for a specific service (for example, the Question Service):
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml logs question-service
```
If a frontend service is available, it can be accessed at:

http://localhost:<frontend-port>

## Development Notes
Each microservice can be built, tested, and run independently.
Environment variables for each service should be clearly documented by the developer responsible for that service.
When making code changes, you can rebuild a specific service by running the `up` command again with the `--build` flag.
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build <service-name>
```

## Note
Each team member is responsible for developing their assigned microservice within its own folder.
The teaching team must have access to this repository as they may need to review commit history for grading or dispute resolution.
