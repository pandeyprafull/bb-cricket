/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_teams', {
    team_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    team_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    team_key_cricket: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    team_key_entity: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      unique: true
    },
    team_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_short_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    team_flag: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'bb_teams'
  });
};
