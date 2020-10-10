/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_task', {
    task_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    task_type: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    redirect_type: {
      type: DataTypes.INTEGER(4),
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
      type: DataTypes.STRING(250),
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
    amount_earn: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    min_amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
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
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'bb_task'
  });
};
