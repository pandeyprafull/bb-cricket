/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_task_id', {
    task_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    task_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    task_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    request_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    verified_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    idfy_response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_task_id'
  });
};
