/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_league_categories', {
    category_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category_msg: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    league_icon: {
      type: DataTypes.STRING(145),
      allowNull: true
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_league_categories'
  });
};
