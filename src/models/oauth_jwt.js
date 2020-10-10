/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('oauth_jwt', {
    client_id: {
      type: DataTypes.STRING(80),
      allowNull: false,
      primaryKey: true
    },
    subject: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    public_key: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'oauth_jwt'
  });
};
