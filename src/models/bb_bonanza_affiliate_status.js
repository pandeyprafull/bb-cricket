/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_bonanza_affiliate_status', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sender_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    deposit_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    game_play_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    sign_up_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    deposit_amount_bonus: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    game_play_amount_bonus: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    sign_up_amount_bonus: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    deposit_txt_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    type: {
      type: DataTypes.INTEGER(11),
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
    tableName: 'bb_bonanza_affiliate_status'
  });
};
