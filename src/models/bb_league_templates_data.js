/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_league_templates_data', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    league_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_league_templates',
        key: 'league_id'
      }
    },
    win_from: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    win_to: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    win_amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    win_percent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    ticket_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    win_product: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bbcoins: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_league_templates_data'
  });
};
