/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_leaderboards_data', {
    row_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leaderboard_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    leaderboard_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    win_from: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    win_to: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    win_product: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    win_product_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    win_amount_bonus: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    win_amount_winnings: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    win_amount_unused: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    win_amount_affiliate: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    ticket_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ticket_name: {
      type: DataTypes.TEXT,
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
    tableName: 'bb_leaderboards_data'
  });
};
