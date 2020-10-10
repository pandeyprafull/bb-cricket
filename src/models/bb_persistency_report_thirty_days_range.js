/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_persistency_report_thirty_days_range', {
    report_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ftd: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    playing: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rakes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    real_cash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bonus: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    real_cash_playing: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    report_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      unique: true
    },
    report_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      unique: true
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
    tableName: 'bb_persistency_report_thirty_days_range'
  });
};
