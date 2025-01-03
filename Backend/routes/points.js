const express = require('express');
const router = express.Router();
const { updateUserPoints } = require('../controllers/pointsController');

// Route to update user points
router.post('/update', updateUserPoints);

module.exports = router;
