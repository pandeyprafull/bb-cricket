/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_teams_lookup', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    fantasy_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'bb_user_teams_lookup'
  });
};
