const mongoose = require("mongoose");

const post = new mongoose.Schema({
  user_name: { type: String },
  user_number: { type: String },
  product_name: { type: String },
  product_details: { type: String },
  deadline: { type: String },
  country: { type: String },
  district: { type: String },
  state: { type: String },
  city: { type: String },
  twon: { type: String },
  category: { type: String },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    surname: { type: String },
    email: { type: String, unique: true },
    photo: { type: String },
    number: { type: Number },
    token: { type: String },
    country: { type: String },
    district: { type: String },
    state: { type: String },
    shop_category: { type: [String] },
    postlist: {
      ownpost: [post],
      otherpost: [post],
    },
    list: {
      wishlist: [
        {
          image: { type: String },
          id: { type: String },
          price: { type: String },
          category: { type: Object },
          model: { type: String },
          storage: { type: String },
        },
      ],
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
