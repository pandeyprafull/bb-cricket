/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_payout_otp', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    withdraw_id: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      unique: true
    },
    admin_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_admin',
        key: 'admin_id'
      }
    },
    otp: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    expiry: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_payout_otp'
  });
};
