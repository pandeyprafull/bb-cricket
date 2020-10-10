/* jshint indent: 2 */
const { Op } = require('sequelize');
let Utils = require('../utils');
let moment = require('moment');
let newDate = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');
let currentDate = newDate
module.exports = function (sequelize, DataTypes) {
  let PromoContents = sequelize.define('bb_promo_contents', {
    row_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    promocode: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    heading: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sub_heading: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
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
      allowNull: false
    }
  }, {
    tableName: 'bb_promo_contents',
    timestamps: false
  });

  PromoContents.getPromoContents = async () => {
    return await PromoContents.findAll({
      where: {
        status: 1,
        start_date: {
          [Op.lte]: currentDate
        },
        end_date: {
          [Op.gte]: currentDate
        }
      },
      attributes: ['row_id', 'promocode', 'heading', 'sub_heading', 'start_date', 'end_date'],
      order: [['row_id', 'desc']]
    })
  }
  return PromoContents;
};