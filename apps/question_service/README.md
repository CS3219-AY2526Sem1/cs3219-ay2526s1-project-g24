# FastAPI Project

This is a FastAPI application containerized with Docker and managed using `uv` for Python dependencies.

## Prerequisites

- Python 3.12+ (if running locally)  
- Docker (if running in a container)  
- `uv` installed for dependency management  

## Running Locally

Install dependencies and run the application:

uv run fastapi dev

This starts the FastAPI development server at http://localhost:8000.

## Running with Docker

Build the Docker image:

docker build -t fastapi-app .

Run the Docker container:

docker run -p 8000:80 fastapi-app

This maps port 8000 on your machine to port 80 in the container. The application will be accessible at http://localhost:8000.


## Notes

- Make sure `uv` is installed globally to run locally.  
- When using Docker, all dependencies are installed inside the container automatically.
