const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    name : { type: String, required: true },
    phone : { type: Number, required: true },
    product_name : { type: String, required: true },
    about_product : { type: String, required: true },
    deadline : { type: String, required: true },
    country : { type: String, required: true },
    district : { type: String, required: true },
    state : { type: String, required: true },  
    city : { type: String, required: true },
    town : { type: String, required: true },
    category : { type: String, required: true },
});


const Post = mongoose.model("Post", postSchema);

module.exports = Post;