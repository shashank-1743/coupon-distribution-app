module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    is_claimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });
  
  return Coupon;
}; 