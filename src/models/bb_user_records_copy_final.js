/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_records_copy_final', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    registered_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    first_deposit: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_deposit: {
      type: DataTypes.DATE,
      allowNull: true
    },
    count_of_deposit: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_cash_deposit: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    first_contest: {
      type: DataTypes.DATE,
      allowNull: true
    },
    first_withdrawal: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_withdrawal: {
      type: DataTypes.DATE,
      allowNull: true
    },
    count_of_withdrawals: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    sum_of_withdrawals: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    total_classic: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_batting: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_bowling: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_classic_kb: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_classic_fb: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    referred_by: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    referred_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    signup_promo_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    signup_promo_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    signup_from: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    signup_from_version: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    signup_channel: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    register_ip: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_active: {
      type: DataTypes.DATE,
      allowNull: true
    },
    old_ident: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    }
  }, {
    tableName: 'bb_user_records_copy_final'
  });
};
