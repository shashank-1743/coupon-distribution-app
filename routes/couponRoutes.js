const express = require('express');
const router = express.Router();
const { Coupon, Claim, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Helper function to generate a cookie ID if not present
const ensureCookieId = (req, res) => {
  if (!req.cookies.couponUserId) {
    const cookieId = crypto.randomBytes(16).toString('hex');
    res.cookie('couponUserId', cookieId, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true 
    });
    return cookieId;
  }
  return req.cookies.couponUserId;
};

// Check if user can claim a coupon
const canUserClaim = async (ip, cookieId) => {
  const cooldownMinutes = parseInt(process.env.CLAIM_COOLDOWN_MINUTES) || 60;
  const cooldownTime = new Date(Date.now() - (cooldownMinutes * 60 * 1000));
  
  const recentClaim = await Claim.findOne({
    where: {
      [Op.or]: [
        { ip_address: ip },
        { cookie_id: cookieId }
      ],
      claimed_at: {
        [Op.gt]: cooldownTime
      }
    }
  });
  
  return !recentClaim;
};

// Get time remaining before user can claim again
const getTimeRemaining = async (ip, cookieId) => {
  const cooldownMinutes = parseInt(process.env.CLAIM_COOLDOWN_MINUTES) || 60;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  
  const recentClaim = await Claim.findOne({
    where: {
      [Op.or]: [
        { ip_address: ip },
        { cookie_id: cookieId }
      ]
    },
    order: [['claimed_at', 'DESC']]
  });
  
  if (!recentClaim) return 0;
  
  const claimTime = new Date(recentClaim.claimed_at).getTime();
  const currentTime = Date.now();
  const elapsedTime = currentTime - claimTime;
  
  if (elapsedTime >= cooldownMs) return 0;
  return Math.ceil((cooldownMs - elapsedTime) / 60000); // Return minutes remaining
};

// Claim a coupon
router.post('/claim', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const cookieId = ensureCookieId(req, res);
    
    // Check if user can claim
    const canClaim = await canUserClaim(ip, cookieId);
    if (!canClaim) {
      const minutesRemaining = await getTimeRemaining(ip, cookieId);
      return res.status(429).json({ 
        success: false, 
        message: `You can claim another coupon in ${minutesRemaining} minutes.`,
        minutesRemaining
      });
    }
    
    // Get next available coupon in round-robin fashion
    const coupon = await Coupon.findOne({
      where: { is_claimed: false },
      order: [['id', 'ASC']]
    });
    
    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        message: 'No coupons available at this time.' 
      });
    }
    
    // Use a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
      // Update coupon
      coupon.is_claimed = true;
      coupon.claimed_at = new Date();
      await coupon.save({ transaction });
      
      // Create claim record
      await Claim.create({
        ip_address: ip,
        cookie_id: cookieId,
        CouponId: coupon.id,
        claimed_at: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Coupon claimed successfully!',
        coupon: {
          code: coupon.code
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error claiming coupon:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while claiming the coupon.' 
    });
  }
});

// Check claim status
router.get('/status', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const cookieId = req.cookies.couponUserId || '';
    
    const minutesRemaining = await getTimeRemaining(ip, cookieId);
    
    return res.status(200).json({
      canClaim: minutesRemaining === 0,
      minutesRemaining
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while checking claim status.' 
    });
  }
});

// Get all previously claimed coupons for the current user
router.get('/history', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const cookieId = req.cookies.couponUserId || '';
    
    // Find all claims for this user (by IP or cookie)
    const claims = await Claim.findAll({
      where: {
        [Op.or]: [
          { ip_address: ip },
          { cookie_id: cookieId }
        ]
      },
      include: [{
        model: Coupon,
        attributes: ['code', 'claimed_at']
      }],
      order: [['claimed_at', 'DESC']]
    });
    
    // Extract coupon codes and claim times
    const claimedCoupons = claims.map(claim => ({
      code: claim.Coupon ? claim.Coupon.code : 'Unknown',
      claimedAt: claim.claimed_at
    }));
    
    return res.status(200).json({
      success: true,
      coupons: claimedCoupons
    });
  } catch (error) {
    console.error('Error fetching coupon history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching your coupon history.' 
    });
  }
});

module.exports = router; 