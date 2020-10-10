/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_journey_activity', {
    row_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    user_journey_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    },
    user_task_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    },
    journey_status: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    task_status: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    earn_benifits_by: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    benifits_received_status: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_user_journey_activity'
  });
};
