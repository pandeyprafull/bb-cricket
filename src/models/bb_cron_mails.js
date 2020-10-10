/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_cron_mails', {
    mail_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    mail_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    mail_params: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER(4),
      allowNull: false
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    }
  }, {
    tableName: 'bb_cron_mails'
  });
};
