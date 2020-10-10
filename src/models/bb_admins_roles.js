/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_admins_roles', {
    role_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    admin_type: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'bb_admins_roles'
  });
};
