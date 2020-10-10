/* jshint indent: 2 */
// let bb_matches = require('../models/bb_matches');
// let bb_tickets = require('../models/bb_tickets');

const { Op } = require('sequelize')
let moment = require('moment');
let currentDateUtc = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');
let Models = require('../models/index');


module.exports = function (sequelize, DataTypes) {
  let user_tickets = sequelize.define('bb_ticket_users', {
    row_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    used_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    ticket_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    play_type: {
      type: DataTypes.STRING(145),
      allowNull: true
    },
    ticket_expiry: {
      type: DataTypes.DATE,
      allowNull: false
    },
    date_used: {
      type: DataTypes.DATE,
      allowNull: true
    },
    match_used: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    league_used: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    notified_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
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
    tableName: 'bb_ticket_users',
    timestamps: false
  });

  user_tickets.associate = (models) =>{
    user_tickets.belongsTo(models.bb_tickets, { foreignKey: 'ticket_id'});
    user_tickets.belongsTo(models.bb_users, { foreignKey: 'user_id'});
  }

  return user_tickets;
};
