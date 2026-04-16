const express = require("express");
const router = express.Router();

const User = require("../modal/userSchema");

// get
router.get("/allDataUser", async (req, res) => {
  try {
    const alluser = await User.find({});
    if (!alluser) {
      return res.status(404).json({ Message: "No user are there" });
    }
    return res.status(200).json(alluser);
  } catch (error) {
    console.log({ Error: error });
  }
});
// get id

router.get("/:email", async (req, res) => {
  try {
    const person = await User.findOne({ email: req.params.email });
    if (!person) {
      return res.status(404).json({ message: "there is no such as a person" });
    }
    return res.status(200).json(person);
  } catch (error) {
    console.log({ Error: error });
  }
});

// post

router.post("/addUser", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = new User(req.body);
    await newUser.save();
    return res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.log({ Error: error });
  }
});

// for update
router.patch("/updateUser/:email", async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: req.body },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.log({ Error: error });
  }
});

// delete data

router.delete("/deleteUser/:email", async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({
      email: req.params.email,
    });
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log({ Error: error });
  }
});

module.exports = router;
