/* jshint indent: 2 */
const moment = require('moment');
const { Op } = require('sequelize');
let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss');
console.log("currentDateTime Gmt", currentDateTime);
module.exports = function (sequelize, DataTypes) {
  let Promotions = sequelize.define('bb_promotions', {
    promotion_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    banner_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    redirect_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    redirect_sport_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    leaderboard_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    play_type: {
      type: DataTypes.STRING(145),
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    website_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sorting_order: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: '0'
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
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    video_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'bb_promotions',
    timestamps: false
  });

  Promotions.getHomoPromoBanners = async () => {
    return await Promotions.findAll({
      where: {
        status: 1,
        play_type: 1,
        banner_type: { [Op.or]: [4, 2]},
        start_date: { [Op.or]: [null, {[Op.lte]: currentDateTime}]},
        end_date: { [Op.or]: [null, {[Op.gte]: currentDateTime}]},

      },
      order: [['sorting_order', 'DESC'], ['promotion_id', 'DESC']]
    })
  }

  return Promotions
};
