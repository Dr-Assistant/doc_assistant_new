# Authorization Model

## Overview

This document details the authorization model for the Dr. Assistant application, focusing on the implementation of Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) to ensure proper access to resources.

## Authorization Approach

The Dr. Assistant application uses a hybrid authorization approach combining:

1. **Role-Based Access Control (RBAC)**: For coarse-grained permissions based on user roles
2. **Attribute-Based Access Control (ABAC)**: For fine-grained permissions based on user, resource, and environmental attributes

This hybrid approach provides both simplicity and flexibility in managing access control.

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
┌───────────┐
│           │
│  Admin    │
│           │
└─────┬─────┘
      │
      │
┌─────┴─────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │
│  Doctor   │     │  Nurse    │     │Reception  │
│           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘
```

### Role Definitions

#### 1. Doctor Role

**Description**: Medical professional providing patient care

**Permissions**:
- View assigned patients
- Create and manage encounters
- Create prescriptions and orders
- View and update clinical notes
- Manage own schedule
- View lab results and imaging

**Resource Access**:
- Full access to assigned patients
- Limited access to other patients (emergency only)
- Full access to own schedule and tasks

#### 2. Admin Role

**Description**: System administrator managing the application

**Permissions**:
- Manage users and roles
- Configure system settings
- View audit logs
- Manage master data
- Generate reports

**Resource Access**:
- Limited access to patient data (for support purposes only)
- Full access to system configuration
- Full access to audit logs

#### 3. Nurse Role

**Description**: Clinical support staff assisting doctors

**Permissions**:
- View assigned patients
- Update patient vitals
- Manage tasks
- View clinical notes
- Prepare patients for encounters

**Resource Access**:
- Limited access to assigned patients
- View-only access to prescriptions and orders
- Limited access to clinical notes

#### 4. Receptionist Role

**Description**: Front desk staff managing appointments and registration

**Permissions**:
- Register new patients
- Schedule appointments
- Check-in patients
- Manage patient demographics

**Resource Access**:
- Limited access to patient demographics
- Full access to appointment scheduling
- No access to clinical data

### RBAC Implementation

#### Database Schema

```sql
-- Roles Table
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Role Permissions Table
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- User Roles Table
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

#### Code Implementation

```javascript
// Check if user has permission
async function hasPermission(userId, resource, action) {
  const permissions = await getUserPermissions(userId);
  return permissions.some(p => p.resource === resource && p.action === action);
}

// Get user permissions
async function getUserPermissions(userId) {
  const roles = await getUserRoles(userId);
  const permissions = [];
  
  for (const role of roles) {
    const rolePermissions = await getRolePermissions(role.id);
    permissions.push(...rolePermissions);
  }
  
  return permissions;
}

// Middleware for permission check
function requirePermission(resource, action) {
  return async (req, res, next) => {
    const userId = req.user.sub;
    
    if (await hasPermission(userId, resource, action)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Forbidden' });
  };
}
```

## Attribute-Based Access Control (ABAC)

### Attribute Categories

1. **User Attributes**:
   - Role
   - Department/Specialty
   - Location
   - Employment status

2. **Resource Attributes**:
   - Resource type (patient, encounter, prescription)
   - Sensitivity level
   - Owner/creator
   - Department

3. **Action Attributes**:
   - Operation type (read, write, delete)
   - Transaction type (clinical, administrative)

4. **Environmental Attributes**:
   - Time of day
   - Access location
   - Device type
   - Network security level

### Policy Structure

```json
{
  "id": "policy-123",
  "description": "Allow doctors to view their patients' records",
  "effect": "allow",
  "target": {
    "resource": {
      "type": "patient"
    },
    "action": {
      "type": "read"
    }
  },
  "condition": {
    "user.role": "doctor",
    "resource.assignedDoctorId": "${user.id}"
  }
}
```

### ABAC Implementation

#### Policy Evaluation Engine

```javascript
// Evaluate policy
function evaluatePolicy(policy, context) {
  // Check if policy applies to this resource and action
  if (!matchesTarget(policy.target, context)) {
    return null; // Policy doesn't apply
  }
  
  // Evaluate condition
  if (evaluateCondition(policy.condition, context)) {
    return policy.effect === 'allow';
  }
  
  return null; // Condition not met
}

// Check if context matches target
function matchesTarget(target, context) {
  if (target.resource && target.resource.type !== context.resource.type) {
    return false;
  }
  
  if (target.action && target.action.type !== context.action.type) {
    return false;
  }
  
  return true;
}

// Evaluate condition
function evaluateCondition(condition, context) {
  for (const [key, value] of Object.entries(condition)) {
    const parts = key.split('.');
    let contextValue = context;
    
    for (const part of parts) {
      contextValue = contextValue[part];
      if (contextValue === undefined) {
        return false;
      }
    }
    
    // Handle variable substitution
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const varPath = value.slice(2, -1).split('.');
      let varValue = context;
      
      for (const part of varPath) {
        varValue = varValue[part];
        if (varValue === undefined) {
          return false;
        }
      }
      
      if (contextValue !== varValue) {
        return false;
      }
    } else if (contextValue !== value) {
      return false;
    }
  }
  
  return true;
}
```

#### Authorization Service

```javascript
// Authorize access
async function authorize(userId, resource, action, context = {}) {
  // Build full context
  const user = await getUserWithAttributes(userId);
  const resourceWithAttributes = await getResourceWithAttributes(resource);
  
  const fullContext = {
    user,
    resource: resourceWithAttributes,
    action: { type: action },
    environment: getEnvironmentAttributes()
  };
  
  // Merge additional context
  Object.assign(fullContext, context);
  
  // Get applicable policies
  const policies = await getPolicies(fullContext);
  
  // Evaluate policies
  let allow = false;
  
  for (const policy of policies) {
    const result = evaluatePolicy(policy, fullContext);
    
    if (result === true) {
      allow = true;
    } else if (result === false) {
      return false; // Explicit deny takes precedence
    }
  }
  
  return allow;
}

// Middleware for authorization
function requireAuthorization(resourceType, action) {
  return async (req, res, next) => {
    const userId = req.user.sub;
    const resourceId = req.params.id;
    
    const resource = {
      id: resourceId,
      type: resourceType
    };
    
    if (await authorize(userId, resource, action)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Forbidden' });
  };
}
```

## Combining RBAC and ABAC

### Hybrid Approach

1. **Use RBAC for UI-Level Access Control**:
   - Control which features and pages users can access
   - Simplify UI rendering based on roles
   - Provide coarse-grained access control

2. **Use ABAC for API-Level Access Control**:
   - Enforce fine-grained access control on API endpoints
   - Consider context-specific attributes
   - Handle complex access scenarios

### Implementation Example

```javascript
// UI-level access control with RBAC
function canAccessFeature(user, feature) {
  return user.permissions.includes(feature);
}

// API-level access control with ABAC
async function canAccessResource(user, resource, action) {
  // First, check role-based permission
  if (!hasPermission(user.id, resource.type, action)) {
    return false;
  }
  
  // Then, check attribute-based policies
  return authorize(user.id, resource, action);
}

// Express middleware combining both
function requireAccess(resourceType, action) {
  return async (req, res, next) => {
    const userId = req.user.sub;
    const resourceId = req.params.id;
    
    // First check RBAC
    if (!await hasPermission(userId, resourceType, action)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Then check ABAC
    const resource = {
      id: resourceId,
      type: resourceType
    };
    
    if (!await authorize(userId, resource, action)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    return next();
  };
}
```

## Implementation Plan

| Task | Description | Priority | Complexity | Ticket Reference |
|------|-------------|----------|------------|------------------|
| RBAC Schema | Create database schema for RBAC | High | Low | MVP-006 |
| Role Management | Implement role CRUD operations | High | Medium | MVP-006 |
| Permission Management | Implement permission CRUD operations | High | Medium | MVP-006 |
| RBAC Middleware | Create middleware for RBAC | High | Medium | MVP-006 |
| Policy Engine | Create ABAC policy engine | Medium | High | MVP-006 |
| Policy Management | Implement policy CRUD operations | Medium | Medium | MVP-006 |
| ABAC Middleware | Create middleware for ABAC | Medium | High | MVP-006 |
| UI Integration | Integrate authorization with UI | Medium | Medium | MVP-006 |

## References

1. [NIST Guide to ABAC](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-162.pdf)
2. [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
3. [AWS IAM Policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html) (as a reference for policy structure)
