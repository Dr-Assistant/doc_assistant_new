# Deployment Guide

This document provides comprehensive instructions for deploying the Dr. Assistant application across different environments, including development, staging, and production.

## Deployment Architecture

The Dr. Assistant application follows a containerized microservices architecture deployed on Kubernetes. The deployment architecture is designed for scalability, reliability, and maintainability.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         KUBERNETES CLUSTER                              │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │  Frontend       │  │  Backend        │  │  AI Processing          │  │
│  │  Namespace      │  │  Namespace      │  │  Namespace              │  │
│  │                 │  │                 │  │                         │  │
│  │  - Web App      │  │  - API Gateway  │  │  - Transcription Pods   │  │
│  │  - Mobile API   │  │  - Core Services│  │  - NLP Processing Pods  │  │
│  │                 │  │  - Integration  │  │  - ML Model Servers     │  │
│  │                 │  │    Services     │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │  Data           │  │  Monitoring     │  │  Security               │  │
│  │  Namespace      │  │  Namespace      │  │  Namespace              │  │
│  │                 │  │                 │  │                         │  │
│  │  - Database     │  │  - Prometheus   │  │  - Cert Manager         │  │
│  │    Clusters     │  │  - Grafana      │  │  - Vault                │  │
│  │  - Cache Clusters│  │  - Loki        │  │  - Network Policies     │  │
│  │  - Storage      │  │  - Jaeger       │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Deployment

| Component | Deployment Method | Scaling Strategy | Resource Requirements |
|-----------|-------------------|------------------|------------------------|
| Frontend Web | Kubernetes Deployment | Horizontal Pod Autoscaler | CPU: 0.5-1 core, Memory: 512MB-1GB |
| API Gateway | Kubernetes Deployment | Horizontal Pod Autoscaler | CPU: 1-2 cores, Memory: 1-2GB |
| Backend Services | Kubernetes Deployment | Horizontal Pod Autoscaler | CPU: 0.5-1 core, Memory: 512MB-1GB per service |
| AI Services | Kubernetes Deployment | Horizontal Pod Autoscaler | CPU: 2-4 cores, Memory: 2-8GB, GPU for inference |
| PostgreSQL | StatefulSet | Manual scaling | CPU: 2-4 cores, Memory: 4-8GB, Storage: 100GB+ |
| MongoDB | StatefulSet | Manual scaling | CPU: 2-4 cores, Memory: 4-8GB, Storage: 100GB+ |
| Redis | StatefulSet | Manual scaling | CPU: 1-2 cores, Memory: 2-4GB |

## Deployment Environments

### Development Environment

**Purpose**: Individual developer testing and feature development

**Infrastructure**:
- Local Kubernetes cluster (Minikube, Kind, or Docker Desktop)
- Local databases or containerized instances
- Mocked external services

**Deployment Process**:
- Manual deployment via kubectl or Skaffold
- Hot reloading for rapid development
- Local image building

**Access**:
- Localhost access only
- No external exposure

### Integration Environment

**Purpose**: Integration testing and feature validation

**Infrastructure**:
- Shared Kubernetes cluster in cloud
- Shared database instances
- Test instances of external services

**Deployment Process**:
- Automated deployment via CI/CD on feature branch merge
- Ephemeral environments for pull requests
- Shared persistent services

**Access**:
- Team access via VPN
- No public exposure

### Staging Environment

**Purpose**: Pre-production validation and testing

**Infrastructure**:
- Production-like Kubernetes cluster
- Replicated database architecture
- Staging instances of external services

**Deployment Process**:
- Automated deployment via CI/CD on main branch merge
- Blue/green deployment for zero-downtime updates
- Data anonymization for production-like testing

**Access**:
- Internal team access
- Limited external access for demos

### Production Environment

**Purpose**: Live application serving real users

**Infrastructure**:
- Production Kubernetes cluster with high availability
- Multi-region database with replication
- Production external service integrations

**Deployment Process**:
- Automated deployment via CI/CD with manual approval
- Blue/green or canary deployment strategies
- Strict validation and rollback procedures

**Access**:
- Public access for frontend
- Secured API access
- Restricted admin access

## Deployment Prerequisites

### Infrastructure Requirements

1. **Kubernetes Cluster**:
   - Kubernetes 1.22+ with the following components:
     - Ingress controller (NGINX or similar)
     - Cert-Manager for TLS certificates
     - Prometheus and Grafana for monitoring
     - Loki for log aggregation
     - Jaeger for distributed tracing

2. **Cloud Resources**:
   - Compute instances for Kubernetes nodes
   - Managed database services (optional)
   - Object storage for backups and assets
   - Load balancers for ingress
   - DNS configuration

3. **CI/CD Pipeline**:
   - GitHub Actions or similar CI/CD platform
   - Container registry (Docker Hub, ECR, GCR)
   - Secrets management solution

### Tool Requirements

1. **Command Line Tools**:
   - kubectl for Kubernetes management
   - Helm for package management
   - Terraform for infrastructure provisioning
   - AWS CLI, Azure CLI, or GCP CLI (depending on cloud provider)

2. **Monitoring Tools**:
   - Prometheus for metrics collection
   - Grafana for visualization
   - Loki for log aggregation
   - Jaeger for distributed tracing

3. **Security Tools**:
   - Vault for secrets management
   - Trivy for container scanning
   - OWASP ZAP for security testing

## Deployment Process

### Infrastructure Provisioning

1. **Create Kubernetes Cluster**:
   ```bash
   # Using Terraform
   cd infrastructure/terraform/environments/[env]
   terraform init
   terraform apply
   ```

2. **Configure Kubernetes**:
   ```bash
   # Get kubeconfig
   aws eks update-kubeconfig --name dr-assistant-[env] --region [region]
   
   # Verify connection
   kubectl get nodes
   ```

3. **Install Core Components**:
   ```bash
   # Install Ingress Controller
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm install ingress-nginx ingress-nginx/ingress-nginx
   
   # Install Cert-Manager
   helm repo add jetstack https://charts.jetstack.io
   helm install cert-manager jetstack/cert-manager --set installCRDs=true
   
   # Install Monitoring Stack
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack
   ```

### Database Setup

1. **PostgreSQL Deployment**:
   ```bash
   # Using Helm
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm install postgresql bitnami/postgresql \
     --set auth.postgresPassword=[password] \
     --set persistence.size=100Gi
   
   # Apply initial schema
   kubectl exec -it postgresql-0 -- psql -U postgres -d postgres -f /tmp/init.sql
   ```

2. **MongoDB Deployment**:
   ```bash
   # Using Helm
   helm install mongodb bitnami/mongodb \
     --set auth.rootPassword=[password] \
     --set persistence.size=100Gi
   
   # Initialize collections
   kubectl exec -it mongodb-0 -- mongo -u root -p [password] --authenticationDatabase admin /tmp/init.js
   ```

3. **Redis Deployment**:
   ```bash
   # Using Helm
   helm install redis bitnami/redis \
     --set auth.password=[password] \
     --set persistence.size=20Gi
   ```

### Application Deployment

1. **Build and Push Docker Images**:
   ```bash
   # Automated via CI/CD
   # Example manual process:
   docker build -t dr-assistant/api-gateway:latest ./backend/api_gateway
   docker push dr-assistant/api-gateway:latest
   ```

2. **Deploy Backend Services**:
   ```bash
   # Using Helm
   helm install api-gateway ./infrastructure/kubernetes/charts/api-gateway \
     --set image.tag=latest \
     --set environment=production
   
   # Repeat for each service
   ```

3. **Deploy Frontend Applications**:
   ```bash
   # Using Helm
   helm install web-app ./infrastructure/kubernetes/charts/web-app \
     --set image.tag=latest \
     --set environment=production
   ```

4. **Deploy AI Services**:
   ```bash
   # Using Helm
   helm install voice-transcription ./infrastructure/kubernetes/charts/voice-transcription \
     --set image.tag=latest \
     --set environment=production
   
   # Repeat for each AI service
   ```

5. **Configure Ingress**:
   ```bash
   kubectl apply -f ./infrastructure/kubernetes/overlays/[env]/ingress.yaml
   ```

### Post-Deployment Verification

1. **Verify Service Health**:
   ```bash
   # Check pod status
   kubectl get pods -A
   
   # Check service endpoints
   kubectl get endpoints
   ```

2. **Run Smoke Tests**:
   ```bash
   # Using automated test suite
   cd scripts/testing
   ./run-smoke-tests.sh [env]
   ```

3. **Verify Monitoring**:
   ```bash
   # Port-forward Grafana
   kubectl port-forward svc/prometheus-grafana 3000:80
   
   # Access Grafana dashboards at http://localhost:3000
   ```

## Deployment Strategies

### Blue/Green Deployment

Used for production deployments to minimize downtime and risk.

1. **Deploy New Version (Green)**:
   ```bash
   # Deploy new version with different name
   helm install api-gateway-green ./infrastructure/kubernetes/charts/api-gateway \
     --set image.tag=v2.0.0 \
     --set environment=production
   ```

2. **Verify Green Deployment**:
   ```bash
   # Run tests against green deployment
   ./scripts/testing/run-tests.sh api-gateway-green
   ```

3. **Switch Traffic**:
   ```bash
   # Update service selector to point to green deployment
   kubectl patch service api-gateway -p '{"spec":{"selector":{"app":"api-gateway-green"}}}'
   ```

4. **Remove Old Version (Blue)**:
   ```bash
   # After confirming green deployment is stable
   helm uninstall api-gateway-blue
   ```

### Canary Deployment

Used for gradual rollout of changes to minimize risk.

1. **Deploy Canary Version**:
   ```bash
   # Deploy canary with limited replicas
   helm install api-gateway-canary ./infrastructure/kubernetes/charts/api-gateway \
     --set image.tag=v2.0.0 \
     --set replicas=1 \
     --set environment=production
   ```

2. **Configure Traffic Split**:
   ```bash
   # Using service mesh or ingress controller for traffic splitting
   kubectl apply -f ./infrastructure/kubernetes/overlays/production/canary/traffic-split.yaml
   ```

3. **Monitor Canary Performance**:
   ```bash
   # Check metrics for canary vs stable
   kubectl port-forward svc/prometheus-grafana 3000:80
   # Review canary dashboard
   ```

4. **Gradually Increase Traffic**:
   ```bash
   # Update traffic split
   kubectl apply -f ./infrastructure/kubernetes/overlays/production/canary/traffic-split-50-50.yaml
   ```

5. **Complete Rollout**:
   ```bash
   # After confirming canary is stable
   kubectl apply -f ./infrastructure/kubernetes/overlays/production/canary/traffic-split-100-0.yaml
   helm upgrade api-gateway ./infrastructure/kubernetes/charts/api-gateway \
     --set image.tag=v2.0.0 \
     --set replicas=3 \
     --set environment=production
   ```

## Rollback Procedures

### Immediate Rollback

In case of critical issues requiring immediate rollback:

1. **Revert to Previous Version**:
   ```bash
   # Using Helm
   helm rollback api-gateway 1
   
   # Or redeploy specific version
   helm upgrade api-gateway ./infrastructure/kubernetes/charts/api-gateway \
     --set image.tag=v1.0.0 \
     --set environment=production
   ```

2. **Verify Rollback**:
   ```bash
   # Check pod status
   kubectl get pods -l app=api-gateway
   
   # Run smoke tests
   ./scripts/testing/run-smoke-tests.sh production api-gateway
   ```

3. **Document Incident**:
   - Record rollback in deployment log
   - Create incident report
   - Schedule post-mortem

### Gradual Rollback

For less critical issues where gradual rollback is preferred:

1. **Deploy Previous Version Alongside Current**:
   ```bash
   helm install api-gateway-previous ./infrastructure/kubernetes/charts/api-gateway \
     --set image.tag=v1.0.0 \
     --set environment=production
   ```

2. **Gradually Shift Traffic**:
   ```bash
   # Update traffic split to send 25% to previous version
   kubectl apply -f ./infrastructure/kubernetes/overlays/production/rollback/traffic-split-75-25.yaml
   
   # Increase to 50%
   kubectl apply -f ./infrastructure/kubernetes/overlays/production/rollback/traffic-split-50-50.yaml
   
   # Complete rollback
   kubectl apply -f ./infrastructure/kubernetes/overlays/production/rollback/traffic-split-0-100.yaml
   ```

3. **Remove Failed Version**:
   ```bash
   helm uninstall api-gateway-current
   ```

## Database Migration

### Schema Migrations

1. **Prepare Migration Scripts**:
   ```bash
   # Create migration script
   cd scripts/database/migrations
   touch V1_2_0__add_new_column.sql
   ```

2. **Test Migration in Staging**:
   ```bash
   # Apply migration to staging
   kubectl exec -it postgresql-0 -n staging -- psql -U postgres -d postgres -f /tmp/migrations/V1_2_0__add_new_column.sql
   ```

3. **Apply Migration to Production**:
   ```bash
   # During maintenance window
   kubectl exec -it postgresql-0 -n production -- psql -U postgres -d postgres -f /tmp/migrations/V1_2_0__add_new_column.sql
   ```

### Data Migrations

1. **Prepare Data Migration Job**:
   ```bash
   # Create migration job manifest
   cd infrastructure/kubernetes/jobs
   touch data-migration-job.yaml
   ```

2. **Test in Staging**:
   ```bash
   kubectl apply -f data-migration-job.yaml -n staging
   kubectl logs job/data-migration -n staging
   ```

3. **Apply to Production**:
   ```bash
   kubectl apply -f data-migration-job.yaml -n production
   kubectl logs job/data-migration -n production
   ```

## Backup and Restore

### Database Backup

1. **Scheduled Backups**:
   ```bash
   # Create backup cronjob
   kubectl apply -f infrastructure/kubernetes/backup/database-backup-cronjob.yaml
   ```

2. **Manual Backup**:
   ```bash
   # PostgreSQL backup
   kubectl exec -it postgresql-0 -- pg_dump -U postgres -d postgres | gzip > backup.sql.gz
   
   # MongoDB backup
   kubectl exec -it mongodb-0 -- mongodump --archive | gzip > backup.archive.gz
   ```

### Database Restore

1. **Restore from Backup**:
   ```bash
   # PostgreSQL restore
   cat backup.sql.gz | gunzip | kubectl exec -i postgresql-0 -- psql -U postgres -d postgres
   
   # MongoDB restore
   cat backup.archive.gz | gunzip | kubectl exec -i mongodb-0 -- mongorestore --archive
   ```

## Monitoring and Logging

### Monitoring Setup

1. **Access Grafana**:
   ```bash
   # Port-forward Grafana
   kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
   ```

2. **Configure Alerts**:
   ```bash
   # Apply alert rules
   kubectl apply -f infrastructure/kubernetes/monitoring/prometheus-rules.yaml
   ```

### Log Access

1. **View Service Logs**:
   ```bash
   # View logs for specific service
   kubectl logs -l app=api-gateway -n backend
   
   # Stream logs
   kubectl logs -f -l app=api-gateway -n backend
   ```

2. **Access Centralized Logs**:
   ```bash
   # Port-forward Grafana for Loki access
   kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
   ```

## Security Considerations

### Secret Management

1. **Store Secrets in Vault**:
   ```bash
   # Add secret to Vault
   vault kv put secret/dr-assistant/production/database username=admin password=secure-password
   ```

2. **Use Kubernetes Secrets**:
   ```bash
   # Create secret from Vault
   vault kv get -format=json secret/dr-assistant/production/database | jq -r .data.data | kubectl create secret generic database-credentials --from-file=/dev/stdin
   ```

### TLS Configuration

1. **Configure Cert-Manager**:
   ```bash
   # Create certificate issuer
   kubectl apply -f infrastructure/kubernetes/security/cert-issuer.yaml
   ```

2. **Request Certificate**:
   ```bash
   # Create certificate resource
   kubectl apply -f infrastructure/kubernetes/security/certificate.yaml
   ```

### Network Policies

1. **Apply Network Policies**:
   ```bash
   # Restrict pod-to-pod communication
   kubectl apply -f infrastructure/kubernetes/security/network-policies.yaml
   ```

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**:
   ```bash
   # Check pod status
   kubectl describe pod <pod-name>
   
   # Check logs
   kubectl logs <pod-name>
   ```

2. **Service Connectivity Issues**:
   ```bash
   # Check service endpoints
   kubectl get endpoints <service-name>
   
   # Test connectivity from debug pod
   kubectl run debug --image=busybox -- sleep 3600
   kubectl exec -it debug -- wget -O- http://service-name:port/health
   ```

3. **Resource Constraints**:
   ```bash
   # Check resource usage
   kubectl top pods
   kubectl top nodes
   ```

### Debugging Tools

1. **Network Debugging**:
   ```bash
   # Deploy network debugging tools
   kubectl apply -f infrastructure/kubernetes/debug/network-debug.yaml
   
   # Access debug pod
   kubectl exec -it network-debug -- bash
   ```

2. **Database Debugging**:
   ```bash
   # Connect to database
   kubectl port-forward svc/postgresql 5432:5432
   psql -h localhost -U postgres -d postgres
   ```

## Deployment Checklist

### Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing in CI
- [ ] Security scan completed
- [ ] Database migration scripts tested
- [ ] Rollback plan documented
- [ ] Monitoring dashboards updated
- [ ] Alert rules configured
- [ ] Documentation updated

### Deployment

- [ ] Notify stakeholders of deployment
- [ ] Apply database migrations
- [ ] Deploy application components
- [ ] Verify service health
- [ ] Run smoke tests
- [ ] Check monitoring dashboards
- [ ] Verify external integrations

### Post-Deployment

- [ ] Monitor application performance
- [ ] Check error rates
- [ ] Verify user experience
- [ ] Document deployment in changelog
- [ ] Update deployment status in tracking system
- [ ] Conduct post-deployment review

## Conclusion

This deployment guide provides a comprehensive approach to deploying the Dr. Assistant application across different environments. By following these procedures, the team can ensure reliable, consistent, and secure deployments.

The guide should be reviewed and updated regularly as the application evolves and deployment processes are refined.
