const { Op } = require('sequelize');


/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let app_update = sequelize.define('bb_app_update', {
    update_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    version_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    version_code: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    version_number: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    version_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    release_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    whats_new_en: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    whats_new_hi: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    device_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'bb_app_update',
    timestamps: false
  });

  app_update.getUpdateList = async (deviceType = false, versionCode) => {
    let result;
    if (deviceType == 1) {  //for iOS
      let sql = `SELECT * FROM bb_app_update WHERE device_type = 1 AND INET_ATON(version_number) > INET_ATON('${versionCode}') ORDER BY update_id DESC`

       result = await sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
      return result;
    } else if (deviceType == 2) { // for Android
      result = await app_update.findOne({
        where: {
          device_type: deviceType, version_code: {
            [Op.gt]: versionCode
          }
        },
        order: [['update_id', 'DESC']]
      })
      return result;
    } else {
      result = await app_update.findOne({
        order: [['update_id', 'DESC']]
      })
      return result
    }
  }

  return app_update;
};
