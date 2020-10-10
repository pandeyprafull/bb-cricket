/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_league_templates_old', {
    league_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    league_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    league_type: {
      type: DataTypes.ENUM('single','multiple'),
      allowNull: false
    },
    confirmed_league: {
      type: DataTypes.ENUM('yes','no'),
      allowNull: false
    },
    max_players: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    win_amount: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    joining_amount: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    }
  }, {
    tableName: 'bb_league_templates_old'
  });
};
