/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_branch_event_tracking', {
    BRANCH_EVENT_TRACKING_ID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    EVENT_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    EVENT_TIMESTAMP: {
      type: DataTypes.DATE,
      allowNull: true
    },
    USER_ID: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    STATE: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    CITY: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    SYSTEM_OS: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    PLATFORM: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    IP_ADDRESS: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTRIBUTED: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_FEATURE: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_CAMPAIGN: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_CHANNEL: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_ADV_PARTNER_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_ADV_PARTNER_ID: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_ADV_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_ADV_MARKETING_TITLE: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_URL: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    AD_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    AD_SET_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    CUSTOMER_PLACEMENT: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ATTR_CLICK_TIMESTAMP: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    FULL_BRANCH_DATA_RECEIVED: {
      type: "LONGBLOB",
      allowNull: true
    },
    CREATED_DATE: {
      type: DataTypes.DATE,
      allowNull: false
    },
    UPDATE_DATE: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_branch_event_tracking'
  });
};
