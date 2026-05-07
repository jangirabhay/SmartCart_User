const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
   name: { type: String, required: true },
    phone: { type: Number, required: true },
    category: { type: String, required: true },
    productDetails: { type: String, required: true },
    productDescription: { type: String, required: true },
    location_coordinate: { type: Object },
    display_location: { type: String },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending',
    },
    
    acceptedBy: {
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        acceptedAt: { type: Date },
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300,
    },
});


const Post = mongoose.model("Post", postSchema);

module.exports = Post;
