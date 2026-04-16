const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error(
        "MONGO_URI is undefined! Check your .env file or dotenv loading.",
      );
    }
    await mongoose.connect(uri);
    console.log("Connected MongoDB");
  } catch (error) {
    console.log({ Error: error });
  }
};

module.exports = connectDB;
