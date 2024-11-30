const mongoose = require("mongoose");
const Article = require("./models/Article"); // Ensure the path is correct

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Mine_co", { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});

// Insert an article
const article = new Article({
  title: "The Mai Project",
  content: "This is the content of The Mai Project article.",
  views: 0,
  likes: 0,
  dislikes: 0,
});

article.save()
  .then(() => {
    console.log("Article inserted");
  })
  .catch((err) => {
    console.error("Error inserting article:", err);
  })
  .finally(() => {
    mongoose.connection.close();
  });
