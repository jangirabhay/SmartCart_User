const express = require("express");
const router = express.Router();

const Post = require("../modal/postSchema");

// router.post("/addPost", async (req, res) => {
//   try {
//     const newPost = new Post(req.body);
//     await newPost.save();
//     res.status(201).json({ message: "Post added successfully", post: newPost });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error adding post", error: error.message });
//   }
// });

router.get("/getPosts", async (req, res) => {
  try {
    const posts = await Post.find({});
    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    res.status(200).json({ message: "Posts retrieved successfully", posts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving posts", error: error.message });
  }
});

router.delete("/deleteRequest/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting post", error: error.message });
  }
});

module.exports = router;
