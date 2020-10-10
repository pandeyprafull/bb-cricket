/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_reward_product', {
    reward_prod_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    reward_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    reward_name: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    reward_name_hi: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description_hi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bbcoins: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    image: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    max_limit: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    left_items: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reward_sub_type: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    real_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: '0.00'
    },
    reward_category_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    },
    ticket_type: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    ticket_ides: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    sorting_order: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_reward_product'
  });
};
