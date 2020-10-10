/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('oauth_scopes', {
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'supported'
    },
    scope: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    client_id: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    is_default: {
      type: DataTypes.INTEGER(6),
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'oauth_scopes'
  });
};
