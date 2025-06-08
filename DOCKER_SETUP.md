# Dr. Assistant - Docker Setup Guide

This guide provides instructions for running the entire Dr. Assistant application using Docker Compose.

## Prerequisites

- **Docker**: Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- **Git**: For cloning the repository

That's it! No need to install Node.js, PostgreSQL, MongoDB, Redis, or any other dependencies locally.

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd doc_assistant_new
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
3. **Update API keys in .env** (optional for basic testing):
   - `GOOGLE_GEMINI_API_KEY`: Your Google Gemini API key
   - `GOOGLE_SPEECH_API_KEY`: Your Google Speech API key
   - `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`: ABDM integration credentials

4. **Start all services**:
   ```bash
   npm run start
   ```

5. **Access the application**:
   - Frontend: http://localhost:3001
   - API Gateway: http://localhost:8000
   - Individual services: See [Service URLs](#service-urls) below

## Available Commands

### Main Commands
```bash
# Start all services
npm run start

# Stop all services
npm run stop

# Restart all services
npm run restart

# Start with fresh builds
npm run start:build

# View status of all services
npm run status
```

### Selective Service Management
```bash
# Start only databases
npm run start:databases

# Start backend services (includes databases)
npm run start:backend

# Start AI services
npm run start:ai

# Start frontend
npm run start:frontend
```

### Logs and Monitoring
```bash
# View all logs
npm run logs

# View database logs
npm run logs:databases

# View backend service logs
npm run logs:backend

# View AI service logs
npm run logs:ai

# View frontend logs
npm run logs:frontend

# Check health of core services
npm run health
```

### Cleanup Commands
```bash
# Clean containers and images
npm run clean

# Clean including volumes (removes all data)
npm run clean:volumes

# Complete cleanup (containers, images, volumes, node_modules)
npm run clean:all
```

## Service URLs

Once all services are running, you can access:

### Frontend
- **Web Application**: http://localhost:3001

### API Gateway
- **API Gateway**: http://localhost:8000

### Backend Services
- **Auth Service**: http://localhost:8020
- **User Service**: http://localhost:8012
- **Voice Recording Service**: http://localhost:8013
- **Schedule Service**: http://localhost:8014
- **Dashboard Service**: http://localhost:8015
- **Patient Service**: http://localhost:8017
- **Task Service**: http://localhost:8016

### AI Services
- **Clinical Note Generation**: http://localhost:9002
- **Prescription Generation**: http://localhost:9003
- **Pre-Diagnosis Summary**: http://localhost:9004

### Integration Services
- **ABDM Integration**: http://localhost:8101

### Databases
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Environment Configuration

The application uses environment variables for configuration. Key variables include:

### Database Configuration
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_DB`

### Security
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time

### AI Services
- `GOOGLE_GEMINI_API_KEY`: For AI-powered features
- `GOOGLE_SPEECH_API_KEY`: For voice transcription

### ABDM Integration
- `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`: ABDM credentials
- `ABDM_BASE_URL`: ABDM API endpoint

## Development Workflow

### Making Code Changes
1. Make changes to your code
2. Services with volume mounts will automatically reload
3. For services that don't auto-reload, restart specific services:
   ```bash
   docker-compose restart <service_name>
   ```

### Adding New Services
1. Create Dockerfile.dev in the service directory
2. Add the service to docker-compose.yml
3. Update environment variables as needed
4. Restart the stack: `npm run restart`

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d dr_assistant

# Access MongoDB
docker-compose exec mongodb mongosh dr_assistant

# Access Redis
docker-compose exec redis redis-cli
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: If you have local services running on the same ports, stop them or change ports in docker-compose.yml

2. **Permission issues**: On Linux/Mac, you might need to run with sudo or add your user to the docker group

3. **Out of disk space**: Run `npm run clean` to free up space

4. **Services not starting**: Check logs with `npm run logs` to see error messages

### Debugging Services
```bash
# Check service status
npm run status

# View logs for specific service
docker-compose logs -f <service_name>

# Access service container
docker-compose exec <service_name> sh

# Restart specific service
docker-compose restart <service_name>
```

### Performance Issues
- Increase Docker Desktop memory allocation (recommended: 4GB+)
- Close unnecessary applications
- Use `npm run start:databases` first, then start other services gradually

## Production Deployment

For production deployment:

1. Update `.env` with production values
2. Use `docker-compose.prod.yml` (if available)
3. Set up proper SSL certificates
4. Configure proper CORS origins
5. Use strong passwords and secrets
6. Set up monitoring and logging

## Support

If you encounter issues:
1. Check the logs: `npm run logs`
2. Verify all services are running: `npm run status`
3. Try a clean restart: `npm run clean && npm run start`
4. Check Docker Desktop is running and has sufficient resources
