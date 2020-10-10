/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let Notifications = sequelize.define('bb_notifications', {
    notification_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    play_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    sender_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    notification_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    is_new: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    image: {
      type: DataTypes.STRING(255),
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
    tableName: 'bb_notifications',
    timestamps: false
  });

  Notifications.getNotifications = async (userId, limit, offset) => {
     let result = await Notifications.findAll({
      where: { receiver_id: userId },
      order: [['date_added','DESC']],
      limit: limit,
      offset: offset
    });
    return result;
  }

  return Notifications;


};
