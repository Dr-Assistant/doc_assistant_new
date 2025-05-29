# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Dr. Assistant platform.

## Overview

The CI/CD pipeline automates the process of testing, building, and deploying the application to different environments. It ensures code quality, reduces manual errors, and enables faster delivery of features.

## Pipeline Architecture

The CI/CD pipeline is implemented using GitHub Actions and consists of the following components:

1. **Continuous Integration (CI)**: Runs on every pull request and push to main/develop branches
2. **Continuous Deployment to Development (CD-Dev)**: Runs on every push to the develop branch
3. **Continuous Deployment to Production (CD-Prod)**: Runs on every push to the main branch or manually triggered

## Workflow Files

The pipeline is defined in the following GitHub Actions workflow files:

- `.github/workflows/ci.yml`: Continuous Integration workflow
- `.github/workflows/cd-dev.yml`: Deployment to Development environment
- `.github/workflows/cd-prod.yml`: Deployment to Production environment

## Continuous Integration (CI)

The CI workflow performs the following steps for each service:

1. **Linting**: Checks code quality and style
2. **Testing**: Runs unit and integration tests
3. **Building**: Builds the application to ensure it compiles correctly

### Services Covered

- Frontend Web Application
- Auth Service
- User Service
- Patient Service
- Schedule Service
- API Gateway

### Test Environment

The CI workflow sets up the following services for testing:

- PostgreSQL
- MongoDB
- Redis

## Continuous Deployment to Development (CD-Dev)

The CD-Dev workflow deploys the application to the development environment when code is pushed to the develop branch. It performs the following steps:

1. **Build Docker Images**: Builds Docker images for each service
2. **Push to Docker Hub**: Pushes the images to Docker Hub with the `dev-{commit-sha}` tag
3. **Deploy to Development Server**: Updates the docker-compose.yml file and restarts the services
4. **Notify Deployment Status**: Sends a notification to Slack

## Continuous Deployment to Production (CD-Prod)

The CD-Prod workflow deploys the application to the production environment when code is pushed to the main branch or manually triggered. It performs the following steps:

1. **Validate Deployment**: Ensures the deployment is confirmed if manually triggered
2. **Build Docker Images**: Builds Docker images for each service
3. **Push to Docker Hub**: Pushes the images to Docker Hub with the `prod-{commit-sha}` and `latest` tags
4. **Deploy to Production Server**: Updates the docker-compose.prod.yml file and restarts the services
5. **Notify Deployment Status**: Sends a notification to Slack

## Environment Variables and Secrets

The CI/CD pipeline requires the following secrets to be configured in GitHub:

### Docker Hub Credentials
- `DOCKER_HUB_USERNAME`: Docker Hub username
- `DOCKER_HUB_TOKEN`: Docker Hub access token

### Development Environment
- `DEV_SSH_USER`: SSH username for the development server
- `DEV_SSH_HOST`: Hostname of the development server
- `DEV_SSH_PRIVATE_KEY`: SSH private key for the development server
- `DEV_KNOWN_HOSTS`: Known hosts file content for the development server

### Production Environment
- `PROD_SSH_USER`: SSH username for the production server
- `PROD_SSH_HOST`: Hostname of the production server
- `PROD_SSH_PRIVATE_KEY`: SSH private key for the production server
- `PROD_KNOWN_HOSTS`: Known hosts file content for the production server

### Notifications
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications

## Setting Up the Pipeline

### Prerequisites

1. GitHub repository with the Dr. Assistant codebase
2. Docker Hub account
3. Development and production servers with Docker and Docker Compose installed
4. Slack workspace for notifications

### Steps

1. **Configure GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add all the required secrets listed above

2. **Prepare the Servers**:
   - Set up the development and production servers
   - Install Docker and Docker Compose
   - Create a deployment user with SSH access
   - Clone the repository to `/opt/dr-assistant`
   - Create a `.env` file with the required environment variables

3. **Initial Deployment**:
   - Push code to the develop branch to trigger the CD-Dev workflow
   - Verify the deployment to the development environment
   - Push code to the main branch or manually trigger the CD-Prod workflow
   - Verify the deployment to the production environment

## Monitoring and Troubleshooting

### Monitoring Deployments

- GitHub Actions: Check the Actions tab in your GitHub repository
- Slack: Monitor deployment notifications in the configured Slack channel
- Servers: Check the Docker containers and logs on the servers

### Common Issues and Solutions

1. **Docker Hub Authentication Failure**:
   - Verify the Docker Hub credentials in GitHub Secrets
   - Ensure the Docker Hub token has the necessary permissions

2. **SSH Connection Failure**:
   - Check the SSH credentials in GitHub Secrets
   - Verify the server is accessible from GitHub Actions
   - Ensure the deployment user has the necessary permissions

3. **Deployment Failure**:
   - Check the logs in GitHub Actions
   - Verify the docker-compose.yml file on the server
   - Check the Docker container logs on the server

## Best Practices

1. **Branch Protection Rules**:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Restrict who can push to the main and develop branches

2. **Pull Request Workflow**:
   - Create feature branches from develop
   - Submit pull requests to develop
   - Merge develop into main for production releases

3. **Versioning**:
   - Use semantic versioning for releases
   - Tag releases in Git
   - Document changes in a CHANGELOG.md file

4. **Rollback Procedure**:
   - Keep previous versions of Docker images
   - Document the rollback procedure
   - Test the rollback procedure regularly
