const express = require("express");
const router = express.Router();
const User = require("../modal/userSchema");
const Post = require("../modal/postSchema");
const admin = require("../firebase/firebaseAdmin");

router.post("/createPost", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();

    const matchUsers = await User.find({
      country: newPost.country,
      state: newPost.state,
      district: newPost.district,
      city: newPost.city,
      town: newPost.town,
      shop_category: { $in: [newPost.category] },
    });

    if (matchUsers.length > 0) {
      // ✅ Fix 1: use _id, not email
      const matchedIds = matchUsers.map((user) => user._id);

      // ✅ Fix 2: push newPost._id reference, not the whole document
      await User.updateMany(
        { _id: { $in: matchedIds } },
        { $push: { "postlist.otherpost": newPost._id } }
      );

      const tokens = matchUsers.map((user) => user.token).filter(Boolean);

      if (tokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({
          notification: {
            title: "New Request",
            body: `${newPost.product_name} - ${newPost.about_product}`,
          },
          tokens,
        });

        // ✅ Log failed tokens for debugging
        response.responses.forEach((resp, i) => {
          if (!resp.success) {
            console.error(`Token failed [${tokens[i]}]:`, resp.error);
          }
        });
      }
    }

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("createPost error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;