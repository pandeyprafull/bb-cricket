/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_promotion_stats', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    promotion_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_promotion_codes',
        key: 'promotion_id'
      }
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_promotion_stats'
  });
};
