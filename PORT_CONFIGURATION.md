# Dr. Assistant - Port Configuration

## 🔧 **Final Port Configuration**

Your Docker Compose setup has been configured to use your original port scheme for consistency with your local development environment.

### 🌐 **Frontend Services**
| Service | Port | URL |
|---------|------|-----|
| **Frontend Web App** | 3001 | http://localhost:3001 |

### 🔗 **API Gateway**
| Service | Port | URL |
|---------|------|-----|
| **API Gateway** | 8000 | http://localhost:8000 |

### 🔧 **Backend Services**
| Service | Port | URL |
|---------|------|-----|
| **Auth Service** | 8020 | http://localhost:8020 |
| **User Service** | 8012 | http://localhost:8012 |
| **Voice Recording** | 8013 | http://localhost:8013 |
| **Schedule Service** | 8014 | http://localhost:8014 |
| **Dashboard Service** | 8015 | http://localhost:8015 |
| **Task Service** | 8016 | http://localhost:8016 |
| **Patient Service** | 8017 | http://localhost:8017 |
| **Encounter Service** | 8006 | http://localhost:8006 |

### 🤖 **AI Services**
| Service | Port | URL |
|---------|------|-----|
| **Clinical Note Generation** | 9002 | http://localhost:9002 |
| **Prescription Generation** | 9003 | http://localhost:9003 |
| **Pre-Diagnosis Summary** | 9004 | http://localhost:9004 |

### 🏛️ **Integration Services**
| Service | Port | URL |
|---------|------|-----|
| **ABDM Integration** | 8101 | http://localhost:8101 |

### 🗄️ **Database Services**
| Service | Port | URL |
|---------|------|-----|
| **PostgreSQL** | 5432 | localhost:5432 |
| **MongoDB** | 27017 | localhost:27017 |
| **Redis** | 6379 | localhost:6379 |

## 🔄 **Port Conflict Resolution**

### **When Running Docker Services:**
If you want to run Docker services on these ports, you'll need to stop your local services first:

```bash
# Stop local services (if running)
# Then start Docker services
npm run start
```

### **When Running Both (Alternative Ports):**
If you need to run both local and Docker services simultaneously, you can temporarily modify the Docker ports:

```bash
# Edit docker-compose.yml to use alternative ports:
# Auth: 8020 → 8021
# Frontend: 3001 → 3002
# Then start Docker services
npm run start
```

## 🎯 **Recommended Usage**

### **For Development:**
1. **Local Services**: Use your existing `scripts/start-local-only.sh`
2. **Docker Services**: Use `npm run start` (stop local services first)

### **For Production:**
- Use Docker Compose with the configured ports
- All services will be containerized and properly networked

### **For Testing:**
- Use Docker Compose to test the complete containerized environment
- Ensures consistency across different machines

## 📝 **Quick Commands**

```bash
# Start all Docker services
npm run start

# Start only databases
npm run start:databases

# Start only backend services
npm run start:backend

# Start only AI services
npm run start:ai

# Start only frontend
npm run start:frontend

# Check service status
npm run status

# View logs
npm run logs

# Stop all services
npm run stop
```

## ✅ **Configuration Complete**

Your Docker setup is now configured with your original port scheme and is ready for use. The configuration ensures:

- ✅ **Consistency** with your local development ports
- ✅ **Cross-platform compatibility** 
- ✅ **Easy switching** between local and Docker environments
- ✅ **Production readiness**
- ✅ **Team collaboration** (same setup for everyone)

## 🚀 **Next Steps**

1. **Test the setup**: `npm run start`
2. **Access the app**: http://localhost:3001
3. **Update API keys** in `.env` file as needed
4. **Start developing** with the containerized environment!
