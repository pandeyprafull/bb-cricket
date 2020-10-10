/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  let Tickets =  sequelize.define('bb_tickets', {
    ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ticket_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false
    },
    play_type: {
      type: DataTypes.STRING(145),
      allowNull: true,
      defaultValue: '0'
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    league_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    league_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fantasy_type: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    ticket_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_users: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_used: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    ticket_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '2'
    },
    joining_amount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    league_category: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    parent_ticket_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    tableName: 'bb_tickets',
    timestamps: false
  });
  Tickets.associate = (models) =>{
  Tickets.belongsTo(models.bb_matches, {foreignKey: 'match_key', as : 'match'});
  Tickets.belongsToMany(models.bb_users, {through: 'bb_ticket_users', foreignKey: 'ticket_id', as: 'users'});
  }
  return Tickets
};
