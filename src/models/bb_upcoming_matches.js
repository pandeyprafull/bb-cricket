/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_upcoming_matches', {
    match_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    feed_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    season_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_related_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_format: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    start_date_iso: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tbc: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_upcoming_matches'
  });
};
