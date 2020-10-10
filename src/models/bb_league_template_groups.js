/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_league_template_groups', {
    group_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    group_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    classic_templates: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    classic_repetitions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    batting_templates: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    batting_repetitions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bowling_templates: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bowling_repetitions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_templates: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    categorisation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    group_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
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
    tableName: 'bb_league_template_groups'
  });
};
