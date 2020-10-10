/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_leaders', {
    leader_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leaderboard_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_leaderboards',
        key: 'leaderboard_id'
      }
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    all_points: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    total_matches: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    rank: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    old_rank: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    win_prize: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    prize_distributed: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    win_ticket_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    win_amount_bonus: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    win_amount_winning: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    win_amount_unused: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    win_amount_affiliate: {
      type: DataTypes.FLOAT,
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
    tableName: 'bb_leaders'
  });
};
