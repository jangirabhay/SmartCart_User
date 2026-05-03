const mongoose = require("mongoose");

const post = new mongoose.Schema({
  user_name: { type: String },
  user_number: { type: String },
  product_name: { type: String },
  product_details: { type: String },
  deadline: { type: String },
  category: { type: String },
});

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String,  required: true},
    email: { type: String, unique: true, required: true },
    photo: { type: String },
    number: { type: Number, required: true },
    token: { type: String,},
    location_coordinate : {type: Object},
    shopName : {type : String},
    gender : {type : String, required: true},
    display_location : {type : String},
    role : {type: String, required: true},
    shop_category: { type: [String] },
    postlist: {
      ownpost: [post],
    },
    list: {
      wishlist: [],
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
