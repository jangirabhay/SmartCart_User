const express = require("express");
const router = express.Router();
const Post = require("../modal/postSchema");

router.post("/createPost", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json({ message: "Post added successfully", post: newPost });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding post", error: error.message });
  }
});

router.get("/getPosts", async (req, res) => {
  try {
    const posts = await Post.find({});
    if (posts.length === 0) {
      return res.status(404).json([]);
    }
    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving posts", error: error.message });
  }
});

router.patch("/updateRequest/:id", async (req, res) => {
  try {
    const updatePost = await Post.findByIdAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true },
    );
    if (updatePost) {
      return res.status(404).json({ meesage: "Post not found" });
    }
    return res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.log({ Error: error });
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

router.delete("/clearPosts", async (req, res) => {
  try {
    await Post.deleteMany({});
    res.json({ message: "All posts deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



