const { Sequelize } = require('sequelize');
require('dotenv').config();
const dbConfig = require('../config/database');

let sequelize;
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Create Sequelize instance based on environment
sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import models
db.Coupon = require('./coupon')(sequelize, Sequelize);
db.Claim = require('./claim')(sequelize, Sequelize);

// Define relationships
db.Coupon.hasOne(db.Claim);
db.Claim.belongsTo(db.Coupon);

module.exports = db; 