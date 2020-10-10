/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_match_balls', {
    match_ball_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    match_key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    batting_team: {
      type: DataTypes.ENUM('a','b'),
      allowNull: true
    },
    innings: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ball_hash_key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    over: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    over_string: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ball: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    ball_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    batsman_key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    batsman_run: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    batsman_dotball: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    batsman_six: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    batsman_four: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    batsman_ball_count: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    non_striker: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bowler_key: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bowler_runs: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    bowler_extras: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    bowler_ball_count: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    bowler_wicket: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    fielder_key: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fielder_catch: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    fielder_runout: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    fielder_stumped: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    team_runs: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_extras: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_ball_count: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_wicket: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    wicket_key: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    wicket_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ball_status: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ball_updated: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_match_balls'
  });
};
