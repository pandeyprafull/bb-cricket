/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  let user_extras = sequelize.define('bb_user_extras', {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    is_paytm_linked: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    customer_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    affiliate_type: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'bb_user_extras',
    timestamps: false
  });

  user_extras.updatePaytmLinkedStatus = async (userId) => {
    let result = await user_extras.findOne({where: { user_id: userId }});
   if(result){
    await user_extras.update({is_paytm_linked: 1}, {where: {user_id: userId}});

   }else{
   await user_extras.create({user_id: userId, is_paytm_linked: 1});
   }
  }
  return user_extras
};
