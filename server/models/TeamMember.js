const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TeamMember extends Model {}

TeamMember.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  team_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member', 'viewer'),
    defaultValue: 'member'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  invitation_status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    defaultValue: 'accepted'
  },
  invitation_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  invitation_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'team_member',
  timestamps: true,
  underscored: true
});

module.exports = TeamMember;
