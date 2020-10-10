/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_campaign', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    prefix: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    no_of_codes: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    total_used: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    unused_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    bonus_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    winning_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    tickets: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    message_in_hindi: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'bb_campaign'
  });
};
