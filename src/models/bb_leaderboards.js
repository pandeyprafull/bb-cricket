/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let LeaderBoards = sequelize.define('bb_leaderboards', {
    leaderboard_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leaderboard_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    season_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: 'bb_seasons',
        key: 'season_key'
      }
    },
    season_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    teams_per_user: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    total_matches: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_users: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_users_batting: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_users_bowling: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    win_amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_winners: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    classic_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    batting_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bowling_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    winning_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    leaderboard_status: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '1'
    },
    leaderboard_order: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    completed_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    credit_assigned: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    credit_finished: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_leaderboards',
    timestamps: false
  });

  LeaderBoards.getLeaderboards = async (fetchType, userId, offset, limit) => {
    return await LeaderBoards.findAll({
      where: { leaderboard_status: fetchType },
      order: [['leaderboard_order', 'DESC'], ['leaderboard_id', 'DESC']],
      offset: offset,
      limit: limit
    })
  }
  return LeaderBoards;
};


'select t1.* from  bb_leaderboards as t1  where     t1.leaderboard_status =  1   order by   t1.leaderboard_order DESC, t1.leaderboard_id DESC  limit 30 offset 0'