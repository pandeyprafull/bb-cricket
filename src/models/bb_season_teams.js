/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_season_teams', {
    season_team_id: {
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
    season_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    season_short_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    season_team_key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_teams',
        key: 'team_key'
      }
    },
    team_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_short_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_season_teams'
  });
};
