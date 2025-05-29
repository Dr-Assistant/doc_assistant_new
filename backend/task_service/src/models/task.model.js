/**
 * Task Model
 * Sequelize model for tasks table
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by'
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'patient_id'
    },
    encounterId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'encounter_id'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    taskType: {
      type: DataTypes.ENUM('documentation', 'review', 'follow_up', 'referral', 'order', 'other'),
      allowNull: false,
      field: 'task_type'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['assigned_to'] },
      { fields: ['created_by'] },
      { fields: ['patient_id'] },
      { fields: ['encounter_id'] },
      { fields: ['status'] },
      { fields: ['due_date'] },
      { fields: ['priority'] },
      { fields: ['task_type'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      beforeUpdate: (task) => {
        // Set completed_at when status changes to completed
        if (task.changed('status') && task.status === 'completed' && !task.completedAt) {
          task.completedAt = new Date();
        }
        
        // Clear completed_at if status changes from completed to something else
        if (task.changed('status') && task.status !== 'completed' && task.completedAt) {
          task.completedAt = null;
        }
      }
    }
  });

  // Instance methods
  Task.prototype.isOverdue = function() {
    return this.dueDate && new Date() > this.dueDate && this.status !== 'completed';
  };

  Task.prototype.isDueToday = function() {
    if (!this.dueDate) return false;
    
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    
    return today.toDateString() === dueDate.toDateString();
  };

  Task.prototype.getDaysUntilDue = function() {
    if (!this.dueDate) return null;
    
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  Task.prototype.canBeAssigned = function() {
    return ['pending', 'in_progress'].includes(this.status);
  };

  Task.prototype.canBeCompleted = function() {
    return ['pending', 'in_progress'].includes(this.status);
  };

  Task.prototype.getDisplayInfo = function() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      assignedTo: this.assignedTo,
      createdBy: this.createdBy,
      patientId: this.patientId,
      encounterId: this.encounterId,
      dueDate: this.dueDate,
      priority: this.priority,
      status: this.status,
      taskType: this.taskType,
      isOverdue: this.isOverdue(),
      isDueToday: this.isDueToday(),
      daysUntilDue: this.getDaysUntilDue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt
    };
  };

  // Class methods
  Task.findPending = function(options = {}) {
    const where = { status: 'pending' };
    
    if (options.assignedTo) {
      where.assignedTo = options.assignedTo;
    }
    
    if (options.createdBy) {
      where.createdBy = options.createdBy;
    }
    
    if (options.patientId) {
      where.patientId = options.patientId;
    }
    
    if (options.taskType) {
      where.taskType = options.taskType;
    }
    
    return this.findAll({
      where,
      order: [
        ['priority', 'ASC'], // urgent=1, high=2, medium=3, low=4 (based on enum order)
        ['due_date', 'ASC'],
        ['created_at', 'ASC']
      ],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  Task.findOverdue = function(options = {}) {
    const where = {
      dueDate: {
        [sequelize.Sequelize.Op.lt]: new Date()
      },
      status: {
        [sequelize.Sequelize.Op.ne]: 'completed'
      }
    };
    
    if (options.assignedTo) {
      where.assignedTo = options.assignedTo;
    }
    
    return this.findAll({
      where,
      order: [['due_date', 'ASC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  Task.findDueToday = function(options = {}) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const where = {
      dueDate: {
        [sequelize.Sequelize.Op.gte]: startOfDay,
        [sequelize.Sequelize.Op.lt]: endOfDay
      },
      status: {
        [sequelize.Sequelize.Op.ne]: 'completed'
      }
    };
    
    if (options.assignedTo) {
      where.assignedTo = options.assignedTo;
    }
    
    return this.findAll({
      where,
      order: [['due_date', 'ASC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  Task.findByAssignee = function(userId, options = {}) {
    const where = { assignedTo: userId };
    
    if (options.status) {
      where.status = options.status;
    }
    
    if (options.taskType) {
      where.taskType = options.taskType;
    }
    
    return this.findAll({
      where,
      order: [
        ['priority', 'ASC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC']
      ],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  Task.findByCreator = function(userId, options = {}) {
    const where = { createdBy: userId };
    
    if (options.status) {
      where.status = options.status;
    }
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  Task.findByPatient = function(patientId, options = {}) {
    const where = { patientId };
    
    if (options.status) {
      where.status = options.status;
    }
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  return Task;
};
