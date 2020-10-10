/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let Leagues = sequelize.define('bb_leagues', {
    league_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
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
    league_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    fantasy_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    template_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'bb_league_templates',
        key: 'league_id'
      }
    },
    reference_league: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_matches',
        key: 'match_key'
      }
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
      type: DataTypes.ENUM('dynamic_winner', 'fixed_winner'),
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
      allowNull: true,
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
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    total_joined: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    is_full: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    unused_applied: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    winnings_applied: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    cash_applied: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    bonus_applied: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    league_repeats: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    repeat_counts: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    proceed_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    ranking_finished: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
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
    refunded: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    outgoings: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    outgoing_bbcoins: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    rake_per_user: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    league_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
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
    user_teams_pdf: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    },
    total_winners_infinity: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'bb_leagues',
    timestamps: false
  });

  Leagues.matchesLeagues = async (match_key, fantasyType) => {
    let where;
    if(fantasyType == 0){
      where = {
        match_key: match_key,
        league_status: 1,
        is_full: 0,
        is_private: 0,
      }
    }else{
      where = {
        match_key: match_key,
        league_status: 1,
        is_full: 0,
        is_private: 0,
        fantasy_type: fantasyType
      }
    }
    return await Leagues.findAll({
      where: where,
      attributes:['category', 'league_id', 'template_id', 'reference_league', 'league_name', 'fantasy_type', 'match_key', 'win_amount', 'bonus_applicable', 'is_mega', 'is_jackpot','is_private', 'league_msg', 'team_type', 'total_joined', 'total_winners_percent', 'confirmed_league','league_type', 'total_winners', 'max_players', 'bonus_percent', 'joining_amount', 'is_infinity', 'win_per_user', 'league_winner_type', 'banner_image', 'time_based_bonus', 'is_reward']
    })
  }

  return Leagues;
};


`SELECT
t1.category AS category,
t1.league_id AS league_id,
t1.template_id AS template_id,
t1.reference_league AS reference_league,
t1.league_name AS league_name,
t1.fantasy_type AS fantasy_type,
t1.match_key AS match_key,
t1.win_amount AS win_amount,
t1.bonus_applicable AS bonus_applicable,
t1.is_mega AS is_mega,
t1.is_jackpot AS is_jackpot,
t1.is_private AS is_private,
t1.league_msg AS league_msg,
t1.team_type AS team_type,
t1.total_joined AS total_joined,
t1.total_winners_percent AS total_winners_percent,
t1.confirmed_league AS confirmed_league,
t1.league_type AS league_type,
t1.total_winners AS total_winners,
t1.max_players AS max_players,
t1.bonus_percent AS bonus_percent,
t1.joining_amount AS joining_amount,
t1.is_infinity AS is_infinity,
t1.win_per_user AS win_per_user,
t1.league_winner_type AS league_winner_type,
t1.banner_image AS banner_image,
t1.time_based_bonus AS time_based_bonus,
t1.is_reward as is_reward
FROM
bb_leagues AS t1
WHERE
t1.match_key = 46053
AND league_status = '1'
AND is_full = '0'
AND is_private = '0'`