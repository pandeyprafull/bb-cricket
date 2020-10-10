/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let User = sequelize.define('bb_users', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    account_type: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '1'
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    username_edited: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    referral_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    facebook_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    google_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    gender: {
      type: DataTypes.CHAR(1),
      allowNull: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    country_code: {
      type: DataTypes.CHAR(2),
      allowNull: true
    },
    zipcode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    unused_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    credits: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    bonus_cash: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    signup_bonus: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    total_cash_added: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    total_contest_joined: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    total_contest_won: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: '0'
    },
    total_cash_won: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    last_contest_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    phone_verified: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    email_verified: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    pan_verified: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    bank_verified: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    aadhaar_verified: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    affiliated_by: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    is_affiliate: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    affiliate_commission: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: '0'
    },
    affiliate_refer_bonus: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_affiliates: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    current_affiliate_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    total_affiliate_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    },
    total_bbcoins: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    current_bbcoins: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    total_referred: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    notifications: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    classic_startup: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    batting_startup: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    bowling_startup: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    verified_user: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    flag: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    total_comments: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    web_token: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: '1'
    },
    customer_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    registered_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    },
    api_secret_key: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    access_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_paytm_linked: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'bb_users',
    timestamps: false
  });

  User.association = (models) => {
    User.belongsToMany(models.bb_tickets, { through: 'bb_ticket_users', foreignKey: 'user_id', as: 'tickets' })
  }
  return User
};
