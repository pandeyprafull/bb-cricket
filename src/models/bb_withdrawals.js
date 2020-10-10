/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_withdrawals', {
    withdraw_id: {
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
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    amount_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    withdraw_charges: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    withdraw_tds: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '2'
    },
    canceled_by_user: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    action_by: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    paid_by: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    payout_type: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    webhook_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payout_details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_batch: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    batch_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    withdraw_error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    user_ip: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fraud_checked: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    fraud_headsup: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    fraud_same_ip: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    fraud_same_referred: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    fraud_same_players: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    },
    instrument_type: {
      type: DataTypes.INTEGER(2),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'bb_withdrawals',
    timestamps: false
  });
};
