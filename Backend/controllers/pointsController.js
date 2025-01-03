// Mock database (Replace with MongoDB queries in production)
const userPoints = {};

// Update user points
exports.updateUserPoints = (req, res) => {
  try {
    const { userId, points } = req.body;

    if (!userId || typeof points !== 'number') {
      return res.status(400).json({ error: 'Invalid userId or points value' });
    }

    // Update user points in the database (mock example)
    if (!userPoints[userId]) {
      userPoints[userId] = 0; // Initialize if user doesn't exist
    }

    userPoints[userId] = points;

    console.log(`[Points Update] User: ${userId}, Points: ${points}`);

    return res.status(200).json({ 
      message: 'Points updated successfully', 
      totalPoints: userPoints[userId] 
    });
  } catch (error) {
    console.error(`[Error] ${error.message}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
