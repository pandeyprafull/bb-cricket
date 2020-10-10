/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_closed_user_teams_0', {
    user_team_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    fantasy_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    team_number: {
      type: DataTypes.INTEGER(4),
      allowNull: false
    },
    player_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    player_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    player_role: {
      type: DataTypes.ENUM('captain','vice_captain'),
      allowNull: true
    },
    points: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
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
    tableName: 'bb_closed_user_teams_0'
  });
};
