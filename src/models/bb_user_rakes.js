/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  let UserRakes =  sequelize.define('bb_user_rakes', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'bb_users',
        key: 'user_id'
      }
    },
    total_rakes: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: '0.00'
    }
  }, {
    tableName: 'bb_user_rakes',
    timestamps: false
  });

  UserRakes.getUserTotalRake = async (userId) => {
    return await UserRakes.findOne({ where: { user_id: userId }, attributes: ['total_rakes'] })
  }

  return UserRakes;
};
