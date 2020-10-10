/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_roi_performance_report', {
    report_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    channel: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    add_partner: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    campaign: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    adset_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ad: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    customer_placement: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    marketing_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registration: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    ftd: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ftd_amount: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    revenue: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    date_modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_roi_performance_report'
  });
};
