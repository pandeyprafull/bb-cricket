/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('oauth_access_tokens_dump', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    access_token: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    client_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(2000),
      allowNull: true
    }
  }, {
    tableName: 'oauth_access_tokens_dump'
  });
};
