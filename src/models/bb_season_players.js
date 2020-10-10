/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_season_players', {
    season_player_id: {
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
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
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
    player_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_players',
        key: 'player_key'
      }
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
    is_playing: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    is_playing11_last: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    is_playing11_prob: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    form_classic: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    form_batting: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    form_bowlling: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    player_status: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'bb_season_players'
  });
};
