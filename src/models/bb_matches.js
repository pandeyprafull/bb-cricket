/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let Matches = sequelize.define('bb_matches', {
    match_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    feed_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    season_key: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    season_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    season_short_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      unique: true
    },
    match_key_cricket: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    match_key_entity: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      unique: true
    },
    match_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_short_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    match_related_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    start_date_unix: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    start_date_india: {
      type: DataTypes.DATE,
      allowNull: true
    },
    match_format: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    closing_ts: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '2700'
    },
    match_order: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    team_a_season_key: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    team_a_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_a_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_a_short_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_b_season_key: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    team_b_key: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    team_b_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    team_b_short_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    match_status: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status_overview: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    playing22: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    show_playing22: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    show_playing22_type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    require_updates: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    unconfirmed_checked: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    ranking_finished: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    credit_assigned: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    credit_finished: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    refunded: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    ready_for_dump: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    dump_done: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    read_index: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    last_read_updated: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    active: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '3'
    },
    admin_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    final_update: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    final_update_players: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completed_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    leaderboard_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    pdf_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    affiliate_distributed: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    categorisation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    group_added: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    category_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender_match_category: {
      type: DataTypes.ENUM('M', 'F'),
      allowNull: false,
      defaultValue: 'M'
    },
    show_last_11: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    show_prob_11: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    match_image: {
      type: DataTypes.STRING(145),
      allowNull: true
    },
    date_added: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    }
  }, {
    tableName: 'bb_matches',
    timestamps: false
  });
  Matches.association = (models) => {
    Matches.hasOne(models.bb_tickets, { as: 'tickets' })
  }

  Matches.getMatch = async (attributes = null, matchKey) => {
    attributes = attributes == null ? [] : attributes;
    return await Matches.findOne({
      raw: true,
      where: { match_key: matchKey },
      atrributes: attributes
    })
  }

  // Matches.getMatchByKey = async (attributes = null, matchKey) => {
  //   attributes = (attributes == null || atrributes == undefined) ? [] : attributes;

  //   return await Matches.findOne({
  //     raw: true,
  //     where: { match_key: matchKey },
  //     atrributes: attributes
  //   })
  // }
  return Matches
};
