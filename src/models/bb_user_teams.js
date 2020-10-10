/* jshint indent: 2 */
let Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  let UserTeams = sequelize.define('bb_user_teams', {
    user_team_id: {
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
      type: DataTypes.ENUM('captain', 'vice_captain'),
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
    tableName: 'bb_user_teams',
    timestamps: false
  });
  UserTeams.checkTeamExists = async (userId, matchKey, fantasyType, teamNumber) => {
    return await UserTeams.findOne({
      where: {
        user_id: userId,
        match_key: matchKey,
        fantasy_type: fantasyType,
        team_number: teamNumber
      }, attributes: ['team_number']
    })
  }
  UserTeams.getTeamCountByMatch = async (user_id, match_key, fantasyType = 1) => {
    return await UserTeams.findAll({
      raw: true,
      where: {
        user_id: user_id,
        match_key: match_key
      },
      attributes: ['fantasy_type', [Sequelize.literal('COUNT(DISTINCT(team_number))'), 'total_teams']],
      group: ['fantasy_type']
    });
  }
  return UserTeams;
};



