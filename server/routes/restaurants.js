const express = require('express');
const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const router = express.Router();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// POST route to add new restaurants
router.post('/addRestaurants', async (req, res) => {
  try {
    const restaurant = req.body; // Expecting a single restaurant object

    // Validate input
    if (Array.isArray(restaurant)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a single restaurant object, not an array',
      });
    }

    // Validate required fields
    if (
      !restaurant.Res_Name ||
      !restaurant.Mobile ||
      !restaurant.Address ||
      restaurant.Latitude === undefined ||
      restaurant.Longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields in restaurant data',
      });
    }

    // Insert restaurant into the database
    const insertedRestaurant = await Restaurant.create(restaurant);

    res.status(201).json({
      success: true,
      message: 'Restaurant added successfully',
      data: insertedRestaurant,
    });
  } catch (error) {
    console.error('Error adding restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding restaurant',
      error: error.message,
    });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(2); // Distance in km, rounded to 2 decimals
}

router.get('/', authenticate, async (req, res) => {
  const { userLat, userLng } = req.query;
  const restaurants = await Restaurant.find();
  const reviews = await Review.find();
  const restaurantsWithReviews = restaurants.map(restaurant => {
    const distance = userLat && userLng && restaurant.Latitude && restaurant.Longitude
      ? calculateDistance(parseFloat(userLat), parseFloat(userLng), restaurant.Latitude, restaurant.Longitude)
      : null;
    const review = reviews.find(review => review.restaurantId.toString() === restaurant._id.toString());
    return {
      ...restaurant._doc,
      reviewStatus: review ? review.reviewStatus : 'not reviewed',
      reviewedBy: review ? review.reviewedBy : null,
      distance
    };
  });
  res.json(restaurantsWithReviews);
});

// POST route to assign a review
router.post('/review/assign/:id', authenticate, async (req, res) => {
  const { reviewedBy } = req.body;
  const restaurantId = req.params.id;

  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Update or create review with status 'assigned'
    const review = await Review.findOneAndUpdate(
      { restaurantId },
      { 
        restaurantId, 
        reviewStatus: 'assigned',
        reviewedBy: reviewedBy || null 
      },
      { 
        upsert: true,
        new: true 
      }
    );

    res.json({ 
      message: 'Review assigned successfully',
      review 
    });
  } catch (error) {
    console.error('Error assigning review:', error);
    res.status(500).json({
      message: 'Server error while assigning review',
      error: error.message
    });
  }
});

// POST route to complete a review
router.post('/review/complete/:id', authenticate, async (req, res) => {
  const restaurantId = req.params.id;

  try {
    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if review exists and is in assigned state
    const existingReview = await Review.findOne({ restaurantId });
    if (!existingReview || existingReview.reviewStatus !== 'assigned') {
      return res.status(400).json({ 
        message: 'Review must be in assigned state to mark as completed' 
      });
    }

    // Update review status to completed
    const review = await Review.findOneAndUpdate(
      { restaurantId },
      { reviewStatus: 'completed' },
      { new: true }
    );

    res.json({ 
      message: 'Review marked as completed',
      review 
    });
  } catch (error) {
    console.error('Error completing review:', error);
    res.status(500).json({
      message: 'Server error while completing review',
      error: error.message
    });
  }
});

module.exports = router;