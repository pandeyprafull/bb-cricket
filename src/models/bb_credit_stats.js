/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let credit_stats = sequelize.define('bb_credit_stats', {
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
    real_cash: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    bonus_cash: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
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
    transaction_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    txn_id: {
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
    },
    unused_cash: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    play_type: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    league_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'bb_credit_stats',
    timestamps: false,
  });

  credit_stats.getTxnHistory =  async (userId, limit, offset, txnType =  false) => {
    let where;
    where = txnType ? { user_id: userId, transaction_type: txnType } : { user_id: userId }
    let result = await credit_stats.findAll({
      where: where,
      order: [['row_id', 'DESC']],
      limit: limit,
      offset: offset,
      attributes: ['row_id', 'user_id', 'real_cash', 'bonus_cash', 'amount', 'league_name', 'match_name', 'match_date', 'transaction_type', 'transaction_message', 'transaction_date', 'modified_date', 'unused_cash', 'play_type', 'match_key', 'league_id'],
    })
    return result;
}
  return credit_stats
};
