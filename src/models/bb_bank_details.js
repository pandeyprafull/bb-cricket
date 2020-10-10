/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_bank_details', {
    bank_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      },
      unique: true
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ifsc_code: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    account_holder: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    bank_branch: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bank_proof: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    account_name_gcf: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gcf_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    beneficiary_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
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
    tableName: 'bb_bank_details',
    timestamps: false
  });
};
