/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_is_playing', {
    playing_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    feed_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    playing_22: {
      type: DataTypes.TEXT,
      allowNull: false
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
    tableName: 'bb_is_playing'
  });
};
