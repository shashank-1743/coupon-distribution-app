require('dotenv').config({ path: '.env.production' });
const { Coupon, sequelize } = require('./models');

const generateCouponCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const seedProductionCoupons = async () => {
  try {
    // Only create tables if they don't exist
    await sequelize.sync();
    
    // Check if coupons already exist
    const existingCoupons = await Coupon.count();
    if (existingCoupons > 0) {
      console.log('Coupons already exist, skipping seed');
      process.exit(0);
    }
    
    // Create 20 sample coupons
    const coupons = [];
    for (let i = 0; i < 20; i++) {
      coupons.push({
        code: generateCouponCode(),
        is_claimed: false
      });
    }
    
    await Coupon.bulkCreate(coupons);
    console.log('Production database seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding production database:', error);
    process.exit(1);
  }
};

seedProductionCoupons();