const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
   full_name : {type: String, required: true},
  number : {type: String, required: true},
  category: { type: String, required: true },
  productDetails: { type: String, required: true },
  productDescription: { type: String, required: true },
  location_coordinate: { type: Object },
  display_location: { type: String },
  radiusSearch: { type: Number },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed"],
    default: "pending",
  },

  acceptedBy: {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
  },
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
