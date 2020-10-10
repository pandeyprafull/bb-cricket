/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_league_templates', {
    league_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    category: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: '0'
    },
    is_private: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    league_order: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    league_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    league_winner_type: {
      type: DataTypes.ENUM('dynamic_winner','fixed_winner'),
      allowNull: true
    },
    min_deposit: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    is_mega: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    is_jackpot: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    league_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    confirmed_league: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    bonus_applicable: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    bonus_percent: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: '0'
    },
    time_based_bonus: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    max_players: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    min_players: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    joining_amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    total_amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    win_amount: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    total_winners: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    is_infinity: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    total_winners_infinity: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    win_per_user: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_winners_percent: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: '0'
    },
    winning_percentage: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: '0'
    },
    league_repeats: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    league_msg: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    banner_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_reward: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    total_bbcoins: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
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
    tableName: 'bb_league_templates'
  });
};
