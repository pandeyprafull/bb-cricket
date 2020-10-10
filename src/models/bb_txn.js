/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_txn', {
    txn_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    gateway_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    promotion_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'bb_promotion_codes',
        key: 'promotion_id'
      }
    },
    txn_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    return_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_mobile_app: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    txn_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '2'
    },
    mihpayid: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    mode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    unmappedstatus: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    addedon: {
      type: DataTypes.DATE,
      allowNull: true
    },
    field9: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    PG_TYPE: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bank_ref_num: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bankcode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    error: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    error_Message: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    payuMoneyId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    net_amount_debit: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    cron_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    pending_count: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    next_pending_check: {
      type: DataTypes.DATE,
      allowNull: true
    },
    next_recheck: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    cron_result: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_ip: {
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
    }
  }, {
    tableName: 'bb_txn'
  });
};
