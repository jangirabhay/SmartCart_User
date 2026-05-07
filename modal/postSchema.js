const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    name : { type: String, required: true },
    phone : { type: Number, required: true },
    category : { type: String, required: true },
});


const Post = mongoose.model("Post", postSchema);

module.exports = Post;
