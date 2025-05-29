const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Role, Permission, RolePermission } = require('../models');
const { logger } = require('../utils/logger');
const { hashPassword } = require('../utils/password');

// Load environment variables
dotenv.config();

// Define default roles
const roles = [
  {
    id: uuidv4(),
    name: 'admin',
    description: 'System administrator with full access'
  },
  {
    id: uuidv4(),
    name: 'doctor',
    description: 'Medical professional providing patient care'
  },
  {
    id: uuidv4(),
    name: 'nurse',
    description: 'Clinical support staff assisting doctors'
  },
  {
    id: uuidv4(),
    name: 'receptionist',
    description: 'Front desk staff managing appointments and registration'
  }
];

// Define default permissions
const permissions = [
  // User permissions
  {
    id: uuidv4(),
    name: 'user:read',
    description: 'Read user information',
    resource: 'user',
    action: 'read'
  },
  {
    id: uuidv4(),
    name: 'user:create',
    description: 'Create new users',
    resource: 'user',
    action: 'create'
  },
  {
    id: uuidv4(),
    name: 'user:update',
    description: 'Update user information',
    resource: 'user',
    action: 'update'
  },
  {
    id: uuidv4(),
    name: 'user:delete',
    description: 'Delete users',
    resource: 'user',
    action: 'delete'
  },

  // Patient permissions
  {
    id: uuidv4(),
    name: 'patient:read',
    description: 'Read patient information',
    resource: 'patient',
    action: 'read'
  },
  {
    id: uuidv4(),
    name: 'patient:create',
    description: 'Create new patients',
    resource: 'patient',
    action: 'create'
  },
  {
    id: uuidv4(),
    name: 'patient:update',
    description: 'Update patient information',
    resource: 'patient',
    action: 'update'
  },
  {
    id: uuidv4(),
    name: 'patient:delete',
    description: 'Delete patients',
    resource: 'patient',
    action: 'delete'
  },

  // Appointment permissions
  {
    id: uuidv4(),
    name: 'appointment:read',
    description: 'Read appointment information',
    resource: 'appointment',
    action: 'read'
  },
  {
    id: uuidv4(),
    name: 'appointment:create',
    description: 'Create new appointments',
    resource: 'appointment',
    action: 'create'
  },
  {
    id: uuidv4(),
    name: 'appointment:update',
    description: 'Update appointment information',
    resource: 'appointment',
    action: 'update'
  },
  {
    id: uuidv4(),
    name: 'appointment:delete',
    description: 'Delete appointments',
    resource: 'appointment',
    action: 'delete'
  },

  // Encounter permissions
  {
    id: uuidv4(),
    name: 'encounter:read',
    description: 'Read encounter information',
    resource: 'encounter',
    action: 'read'
  },
  {
    id: uuidv4(),
    name: 'encounter:create',
    description: 'Create new encounters',
    resource: 'encounter',
    action: 'create'
  },
  {
    id: uuidv4(),
    name: 'encounter:update',
    description: 'Update encounter information',
    resource: 'encounter',
    action: 'update'
  },
  {
    id: uuidv4(),
    name: 'encounter:delete',
    description: 'Delete encounters',
    resource: 'encounter',
    action: 'delete'
  }
];

// Define role-permission mappings
const rolePermissions = [
  // Admin role permissions (all permissions)
  ...permissions.map(permission => ({
    id: uuidv4(),
    roleId: roles[0].id, // admin role
    permissionId: permission.id
  })),

  // Doctor role permissions
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'user:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'user:update').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'patient:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'patient:update').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'appointment:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'appointment:update').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'encounter:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'encounter:create').id
  },
  {
    id: uuidv4(),
    roleId: roles[1].id, // doctor role
    permissionId: permissions.find(p => p.name === 'encounter:update').id
  },

  // Nurse role permissions
  {
    id: uuidv4(),
    roleId: roles[2].id, // nurse role
    permissionId: permissions.find(p => p.name === 'user:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[2].id, // nurse role
    permissionId: permissions.find(p => p.name === 'patient:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[2].id, // nurse role
    permissionId: permissions.find(p => p.name === 'patient:update').id
  },
  {
    id: uuidv4(),
    roleId: roles[2].id, // nurse role
    permissionId: permissions.find(p => p.name === 'appointment:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[2].id, // nurse role
    permissionId: permissions.find(p => p.name === 'encounter:read').id
  },

  // Receptionist role permissions
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'user:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'patient:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'patient:create').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'patient:update').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'appointment:read').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'appointment:create').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'appointment:update').id
  },
  {
    id: uuidv4(),
    roleId: roles[3].id, // receptionist role
    permissionId: permissions.find(p => p.name === 'appointment:delete').id
  }
];

// Seed the database
async function seed() {
  try {
    // Sync database models
    await sequelize.sync({ force: true });
    logger.info('Database synchronized successfully');

    // Create roles
    await Role.bulkCreate(roles);
    logger.info('Roles created successfully');

    // Create permissions
    await Permission.bulkCreate(permissions);
    logger.info('Permissions created successfully');

    // Create role-permission mappings
    await RolePermission.bulkCreate(rolePermissions);
    logger.info('Role-permission mappings created successfully');

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminPasswordHash = await hashPassword(adminPassword);

    await sequelize.models.User.create({
      id: uuidv4(),
      username: 'admin',
      email: 'admin@drassistant.com',
      full_name: 'System Administrator',
      password_hash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      password_changed_at: new Date()
    });
    logger.info('Admin user created successfully');

    // Create doctor user
    const doctorPassword = 'password';
    const doctorPasswordHash = await hashPassword(doctorPassword);

    await sequelize.models.User.create({
      id: uuidv4(),
      username: 'doctor',
      email: 'doctor@example.com',
      full_name: 'Dr. John Doe',
      password_hash: doctorPasswordHash,
      role: 'doctor',
      specialty: 'General Medicine',
      status: 'active',
      password_changed_at: new Date()
    });
    logger.info('Doctor user created successfully');

    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error(`Seed error: ${error.message}`);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the seed function
seed();
