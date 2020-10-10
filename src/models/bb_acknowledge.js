/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_acknowledge', {
    row_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    lang_type: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: 'en'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'bb_acknowledge',
    timestamps: false
  });
};
