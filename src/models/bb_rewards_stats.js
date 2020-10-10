/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_rewards_stats', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    bbcoins: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    league_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    league_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_date: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    team_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    team_a_flag: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    team_b_flag: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    play_type: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    transaction_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    by_admin: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    transaction_message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_rewards_stats'
  });
};
