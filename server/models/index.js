const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['admin', 'manager', 'sdr', 'closer']]
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Lead Model
const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['new', 'contacted', 'qualified', 'set', 'closed', 'lost']]
    }
  },
  first_name: {
    type: DataTypes.STRING(100)
  },
  last_name: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  company: {
    type: DataTypes.STRING(100)
  },
  job_title: {
    type: DataTypes.STRING(100)
  },
  notes: {
    type: DataTypes.TEXT
  },
  crm_id: {
    type: DataTypes.STRING(255)
  },
  ai_score: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'leads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Activity Model
const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['call', 'email', 'text', 'appointment']]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['completed', 'scheduled', 'cancelled']]
    }
  },
  start_time: {
    type: DataTypes.DATE
  },
  end_time: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Deal Model
const Deal = sequelize.define('Deal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  stage: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['set', 'shown', 'pitched', 'follow_up', 'closed_won', 'closed_lost']]
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  close_date: {
    type: DataTypes.DATEONLY
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'deals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Dashboard Preferences Model
const DashboardPreference = sequelize.define('DashboardPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  layout: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  tableName: 'dashboard_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// CRM Connection Model
const CrmConnection = sequelize.define('CrmConnection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  crm_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['gohighlevel', 'hubspot', 'closeio']]
    }
  },
  access_token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'crm_connections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ShiFi Integration Model
const ShifiIntegration = sequelize.define('ShifiIntegration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  access_token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'shifi_integration',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Training Module Model
const TrainingModule = sequelize.define('TrainingModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['beginner', 'intermediate', 'advanced']]
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'training_modules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// User Training Progress Model
const UserTrainingProgress = sequelize.define('UserTrainingProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  completed_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'user_training_progress',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Performance Metrics Model
const PerformanceMetric = sequelize.define('PerformanceMetric', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  metric_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  metric_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'performance_metrics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// AI Insights Model
const AiInsight = sequelize.define('AiInsight', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  insight_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  insight_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['low', 'medium', 'high']]
    }
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'ai_insights',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Coaching Session Model
const CoachingSession = sequelize.define('CoachingSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['scheduled', 'completed', 'cancelled']]
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'coaching_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Lead Scores History Model
const LeadScoreHistory = sequelize.define('LeadScoreHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  factors: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  tableName: 'lead_scores_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Revenue Prediction Model
const RevenuePrediction = sequelize.define('RevenuePrediction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  prediction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  predicted_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  confidence_low: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  confidence_high: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  factors: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  tableName: 'revenue_predictions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Sales Constraint Model
const SalesConstraint = sequelize.define('SalesConstraint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  issue: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  impact: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['low', 'medium', 'high']]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['active', 'monitoring', 'resolved']]
    }
  },
  recommendation: {
    type: DataTypes.TEXT
  },
  resolution: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'sales_constraints',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
User.hasMany(Activity, { foreignKey: 'user_id' });
Activity.belongsTo(User, { foreignKey: 'user_id' });

Lead.hasMany(Activity, { foreignKey: 'lead_id' });
Activity.belongsTo(Lead, { foreignKey: 'lead_id' });

Lead.hasMany(Deal, { foreignKey: 'lead_id' });
Deal.belongsTo(Lead, { foreignKey: 'lead_id' });

User.hasMany(Deal, { foreignKey: 'closer_id', as: 'CloserDeals' });
Deal.belongsTo(User, { foreignKey: 'closer_id', as: 'Closer' });

User.hasOne(DashboardPreference, { foreignKey: 'user_id' });
DashboardPreference.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CrmConnection, { foreignKey: 'user_id' });
CrmConnection.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(ShifiIntegration, { foreignKey: 'user_id' });
ShifiIntegration.belongsTo(User, { foreignKey: 'user_id' });

User.belongsToMany(TrainingModule, { through: UserTrainingProgress, foreignKey: 'user_id' });
TrainingModule.belongsToMany(User, { through: UserTrainingProgress, foreignKey: 'module_id' });

User.hasMany(PerformanceMetric, { foreignKey: 'user_id' });
PerformanceMetric.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AiInsight, { foreignKey: 'user_id' });
AiInsight.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CoachingSession, { foreignKey: 'user_id' });
CoachingSession.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CoachingSession, { foreignKey: 'coach_id', as: 'CoachingSessions' });
CoachingSession.belongsTo(User, { foreignKey: 'coach_id', as: 'Coach' });

Lead.hasMany(LeadScoreHistory, { foreignKey: 'lead_id' });
LeadScoreHistory.belongsTo(Lead, { foreignKey: 'lead_id' });

module.exports = {
  sequelize,
  User,
  Lead,
  Activity,
  Deal,
  DashboardPreference,
  CrmConnection,
  ShifiIntegration,
  TrainingModule,
  UserTrainingProgress,
  PerformanceMetric,
  AiInsight,
  CoachingSession,
  LeadScoreHistory,
  RevenuePrediction,
  SalesConstraint
};
