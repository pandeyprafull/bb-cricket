/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_affiliate_stats', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    play_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    affiliate_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    joiner: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    joining_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    commission: {
      type: DataTypes.INTEGER(3),
      allowNull: false
    },
    affiliate_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '1'
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
    tableName: 'bb_affiliate_stats'
  });
};
