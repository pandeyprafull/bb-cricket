/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_kyc_attempts', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    kyc_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    attempts: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    }
  }, {
    tableName: 'bb_kyc_attempts'
  });
};
