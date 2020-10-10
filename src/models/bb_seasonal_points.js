/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_seasonal_points', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    season_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_seasons',
        key: 'season_key'
      }
    },
    player_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_players',
        key: 'player_key'
      }
    },
    seasonal_start_points: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    seasonal_classic_points: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    seasonal_batting_points: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    seasonal_bowling_points: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_seasonal_points'
  });
};
