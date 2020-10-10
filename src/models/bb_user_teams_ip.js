/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_teams_ip', {
    ip_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_matches',
        key: 'match_key'
      }
    },
    fantasy_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    team_number: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    user_ip: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    action: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_user_teams_ip'
  });
};
