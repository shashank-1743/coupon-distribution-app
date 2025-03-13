require('dotenv').config();
process.env.NODE_ENV = 'production'; // Force production environment to use Supabase config

const { Coupon, sequelize } = require('./models');

const generateCouponCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const seedCoupons = async () => {
  try {
    console.log('Connecting to Supabase database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    
    // Sync models with database
    await sequelize.sync({ force: true });
    console.log('Database synced');
    
    // Create 20 sample coupons
    const coupons = [];
    for (let i = 0; i < 20; i++) {
      coupons.push({
        code: generateCouponCode(),
        is_claimed: false
      });
    }
    
    await Coupon.bulkCreate(coupons);
    console.log('Coupons seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding coupons:', error);
    process.exit(1);
  }
};

seedCoupons(); 