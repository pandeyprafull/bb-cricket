/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_admin_cash_added', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    txn_number: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    unused: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    winnings: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    bonus: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    total_added: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    txn_type: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    txn_message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    admin_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_admin',
        key: 'admin_id'
      }
    },
    admin_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_admin_cash_added'
  });
};
