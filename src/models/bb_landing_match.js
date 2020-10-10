/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_landing_match', {
    landing_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_matches',
        key: 'match_key'
      }
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'bb_landing_match'
  });
};
