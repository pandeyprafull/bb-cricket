/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_seasons', {
    season_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    season_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    season_key_cricket: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    season_key_entity: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      unique: true
    },
    season_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    season_short_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    active: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_seasons'
  });
};
