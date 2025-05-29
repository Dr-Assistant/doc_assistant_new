const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Token = sequelize.define('Token', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('refresh', 'access', 'reset'),
      allowNull: false
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false
    },
    blacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    family: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Token family for refresh token rotation'
    },
    device_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Information about the device that generated the token'
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'tokens',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['token']
      },
      {
        fields: ['expires']
      },
      {
        fields: ['family']
      }
    ]
  });

  return Token;
};
