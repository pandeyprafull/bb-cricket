/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_task', {
    user_task_id: {
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
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    task_type: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    task_title: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    task_title_hi: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    task_short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    task_short_description_hi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    task_long_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    task_long_description_hi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timeline: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    amount_type: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    min_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    min_matches: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    min_league: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    min_referal: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    added_by: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    updated_by: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    task_status: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    multiple_task_response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    redirection_type: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_user_task'
  });
};
