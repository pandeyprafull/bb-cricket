/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let UserRecords = sequelize.define('bb_user_records', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    first_deposit: {
      type: DataTypes.DATE,
      allowNull: true
    },
    first_deposit_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: '0.00'
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
    tableName: 'bb_user_records',
    timestamps: false
  });

  UserRecords.getUserRecords = async (userId) => {
    return await UserRecords.findAll({
      where: { user_id: userId },
      attributes: [
        [sequelize.fn('SUM', (sequelize.fn('COALESCE', (sequelize.col('total_batting')), 0), sequelize.literal('+'), sequelize.fn('COALESCE', (sequelize.col('total_bowling')), 0), sequelize.literal('+'), sequelize.fn('COALESCE', (sequelize.col('total_classic')), 0), sequelize.literal('+'), sequelize.fn('COALESCE', (sequelize.col('total_classic_fb')), 0), sequelize.literal('+'), sequelize.fn('COALESCE', (sequelize.col('total_classic_kb')), 0))), 'totalJoined']
      ],
    })
  }
  return UserRecords;
};


