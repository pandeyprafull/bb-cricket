/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_withdrawal_records', {
    wid: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    matches: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    headsup_leagues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_ips: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    same_ip_leagues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    same_referred_leagues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    same_player_leagues: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'bb_withdrawal_records'
  });
};
