/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_player_selected', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    action_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    fantasy_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    player_keys: {
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
    tableName: 'bb_player_selected'
  });
};
