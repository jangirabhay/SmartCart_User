const mongoose = require("mongoose");



const userSchema = new mongoose.Schema(
  {
    full_name: { type: String,  required: true},
    email: { type: String, unique: true, required: true },
    photo: { type: String },
    number: { type: String, required: true, unique: true},
    token: { type: String,},
    location_coordinate : {type: Object},
    shopName : {type : String},
    gender : {type : String, required: true},
    display_location : {type : String},
    role : {type: String, required: true},
    shop_category: { type: [String] },
    ownPost : [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    clientPost : [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
      wishlist: [],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
