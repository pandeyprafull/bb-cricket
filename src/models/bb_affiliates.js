/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_affiliates', {
    affiliate_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sender: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    receiver: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    total_earnings: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    date_added: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_affiliates'
  });
};
