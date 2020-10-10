/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_leagues_old', {
    league_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    template_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    match_key: {
      type: DataTypes.STRING(255),
      allowNull: false
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
    total_joined: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
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
    tableName: 'bb_leagues_old'
  });
};
