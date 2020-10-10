/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_user_rakes_by_match', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bb_matches',
        key: 'match_key'
      }
    },
    user_rake: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    rake_date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_user_rakes_by_match'
  });
};
