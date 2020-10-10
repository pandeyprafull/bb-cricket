/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_players', {
    player_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    player_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    player_key_cricket: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    player_key_entity: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      unique: true
    },
    player_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    player_photo: {
      type: DataTypes.STRING(145),
      allowNull: true
    },
    player_card_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    player_full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    player_playing_role: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    player_points: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: '0'
    },
    player_credits: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_players'
  });
};
