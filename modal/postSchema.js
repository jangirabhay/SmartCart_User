const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

customer_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
  category: { type: String, required: true },
  productDetails: { type: String, required: true },
  productDescription: { type: String, required: true },
  location_coordinate: { type: Object },
  display_location: { type: String },
  radiusSearch: { type: Number},

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed"],
    default: "pending",
  },

seller_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
  {
    timestamps: true,
  
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
