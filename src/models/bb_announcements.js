/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let Announcements = sequelize.define('bb_announcements', {
    row_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    screen_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    play_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: '0'
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
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
    tableName: 'bb_announcements',
    timestamps: false
  });

  Announcements.getAnnouncements = async (screenType, playType) => {
    return await Announcements.findAll({
      where: { screen_type: screenType, status: 1, play_type: playType },
      attributes: ['title', 'match_key', 'match_name', 'message'],
      order: [['row_id', 'DESC']],
      limit:1
    })
  }
  return Announcements;
};


`SELECT
t1.title AS title,
t1.match_key AS match_key,
t1.match_name AS match_name,
t1.message AS message
FROM
bb_announcements AS t1
WHERE
t1.screen_type = 5 AND t1.status = '1' AND play_type = 1
ORDER BY row_id DESC`