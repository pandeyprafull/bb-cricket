/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_otp_match', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    admin_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_admin',
        key: 'admin_id'
      }
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_matches',
        key: 'match_key'
      },
      unique: true
    },
    action: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
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
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_otp_match'
  });
};
