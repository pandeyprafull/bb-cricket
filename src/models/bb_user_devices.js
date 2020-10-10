/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_devices', {
    id: {
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
      },
      unique: true
    },
    device_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    device_token: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    current_language: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    is_login: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    app_version: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    user_ip: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_user_devices',
    timestamps: false
  });
};
