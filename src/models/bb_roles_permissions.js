/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_roles_permissions', {
    role_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_admins_roles',
        key: 'role_id'
      }
    },
    permission_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'bb_roles_permissions'
  });
};
