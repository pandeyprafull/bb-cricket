/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_aadhaar_details', {
    aadhaar_id: {
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
    aadhaar_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    aadhaar_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    address1: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address2: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    zipcode: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    image1: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    task_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true
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
    tableName: 'bb_aadhaar_details',
    timestamps: false
  });
};
