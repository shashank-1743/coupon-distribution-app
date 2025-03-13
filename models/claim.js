module.exports = (sequelize, DataTypes) => {
  const Claim = sequelize.define('Claim', {
    ip_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cookie_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    claimed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
  
  return Claim;
}; 