const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('mongodb+srv://Mai:Emma23121993%40@cluster0.pvyq3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Define the User Schema
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

// Update Users
async function addPointsField() {
  try {
    const result = await User.updateMany(
      {}, // Match all documents
      { $set: { points: 0 } } // Add 'points' field with a default value of 0
    );
    console.log(`✅ ${result.modifiedCount || result.nModified} documents updated`);
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error updating points field:', error);
    mongoose.connection.close();
  }
}

// Run the Update Function
addPointsField();
