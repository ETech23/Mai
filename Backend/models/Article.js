const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  image: { type: String, default: null }, // URL or base64 string of the image
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Article", ArticleSchema);
