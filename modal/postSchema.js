const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  name: {type:String,required:true},
  number: {type:Number,required:true},
  token : {type:String,required:true},
  customer_id : {
     type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
  default: null
  },
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

seller_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Seller',
  default: null
}});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
