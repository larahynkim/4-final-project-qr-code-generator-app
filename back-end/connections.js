const express = require('express');
const mongoose = require('mongoose');
const { User } = require('./models/User')
const authenticateToken = require('./authRoutes');
const router = express.Router();
const defaultImage = '/default.png'; 

router.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, 'first_name last_name profile_picture').exec();
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/connections/:userId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;

  try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid User ID' });
      }

      const user = await User.findById(userId);
      
      if (!user || !user.connections) {
          return res.status(404).json({ error: 'User not found or no connections available' });
      }

      const uniqueFriendIds = new Set();
      const connectionsDetails = [];

      for (const connection of user.connections) {
          if (!uniqueFriendIds.has(connection.friend_id.toString())) {
              uniqueFriendIds.add(connection.friend_id.toString());
              const friend = await User.findById(connection.friend_id).select('first_name last_name profile_picture');
              connectionsDetails.push({
                  friend_id: connection.friend_id,
                  first_name: friend.first_name,
                  last_name: friend.last_name,
                  profile_picture: friend.profile_picture || defaultImage,
                  platforms: connection.platforms
              });
          }
      }

      res.json(connectionsDetails);
  } catch (error) {
      console.error('Error fetching user connections:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router;