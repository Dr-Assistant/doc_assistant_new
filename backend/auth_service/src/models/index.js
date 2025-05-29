const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dr_assistant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./user.model')(sequelize);
const Role = require('./role.model')(sequelize);
const Permission = require('./permission.model')(sequelize);
const RolePermission = require('./role-permission.model')(sequelize);
const UserRole = require('./user-role.model')(sequelize);
const Token = require('./token.model')(sequelize);

// Define associations
// User and Role (many-to-many)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' });

// Role and Permission (many-to-many)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' });

// User and Token (one-to-many)
User.hasMany(Token, { foreignKey: 'userId', as: 'tokens' });
Token.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  Token
};
