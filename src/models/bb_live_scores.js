/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_live_scores', {
    live_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    api_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    season_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_related_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    start_date_india: {
      type: DataTypes.DATE,
      allowNull: false
    },
    match_format: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    team_a_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_a_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_b_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_b_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_status: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status_overview: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    toss: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    match_innings: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_live_scores'
  });
};
