/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('cron_auto_withdraw', {
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'cron_auto_withdraw'
  });
};
