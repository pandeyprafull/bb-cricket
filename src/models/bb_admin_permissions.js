/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_admin_permissions', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    p_code: {
      type: DataTypes.STRING(15),
      allowNull: false
    }
  }, {
    tableName: 'bb_admin_permissions'
  });
};
