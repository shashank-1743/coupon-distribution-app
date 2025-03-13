require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pxwidyghlkbwpqndloti.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY; // Make sure this is added to your .env.production file

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.log('Checking for existing coupons...');
    
    // Check if coupons already exist
    const { count, error: countError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      throw countError;
    }
    
    if (count > 0) {
      console.log('Coupons already exist, skipping seed');
      process.exit(0);
    }
    
    console.log('No existing coupons found. Creating 20 sample coupons...');
    
    // Create 20 sample coupons
    const coupons = [];
    for (let i = 0; i < 20; i++) {
      coupons.push({
        code: generateCouponCode(),
        is_claimed: false
      });
    }
    
    // Insert coupons
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupons);
      
    if (error) {
      throw error;
    }
    
    console.log('Production database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding production database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCoupons();