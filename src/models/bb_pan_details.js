/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bb_pan_details', {
    pan_id: {
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
    pan_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pan_number: {
      type: DataTypes.STRING(20),
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
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    task_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true
    },
    pan_name_idfy: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    idfy_status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
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
    tableName: 'bb_pan_details',
    timestamps: false
  });
};
