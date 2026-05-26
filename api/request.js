const express = require("express");
const router = express.Router();
const Post = require("../modal/postSchema");
const User = require("../modal/userSchema");
const admin = require("../firebase/firebaseAdmin");

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
router.post("/createPost", async (req, res) => {
  try {
    const {
      createdBy,
      category,
      productDetails,
      productDescription,
      location_coordinate, 
      display_location,
      radiusSearch,
    } = req.body;

    if (!location_coordinate?.latitude || !location_coordinate?.longitude) {
      return res.status(400).json({
        message: "location_coordinate with latitude and longitude is required",
      });
    }
    if (!radiusSearch) {
      return res.status(400).json({ message: "radiusSearch (km) is required" });
    }


    const newPost = new Post(req.body);
    await newPost.save();

    const matchingSellers = await User.find({
      role: "Seller",
      shop_category: { $in: [category] },
      "location_coordinate.latitude": { $exists: true, $ne: null, $ne: "" },
      "location_coordinate.longitude": { $exists: true, $ne: null, $ne: "" },
    });

    if (matchingSellers.length === 0) {
      return res.status(201).json({
        message: "Post created. No matching sellers found.",
        post: newPost,
      });
    }

    const nearbySellers = matchingSellers.filter((seller) => {
      const sellerLat = seller.location_coordinate?.latitude;
      const sellerLng = seller.location_coordinate?.longitude;
    
      if (!sellerLat || !sellerLng || sellerLat === "" || sellerLng === "") {
        return false;
      }

      const dist = getDistanceKm(
        location_coordinate.latitude, 
        location_coordinate.longitude, 
        sellerLat, 
        sellerLng, 
      );
      return dist <= radiusSearch;
    });

    if (nearbySellers.length === 0) {
      return res.status(201).json({
        message: `Post created. No sellers found within ${radiusSearch}km.`,
        post: newPost,
      });
    }


    const fcmTokens = [];

    await Promise.all(
      nearbySellers.map(async (seller) => {
        if (seller.token) {
          fcmTokens.push(seller.token);
        }
      }),
    );

    if (fcmTokens.length > 0) {
      const fcmMessage = {
        notification: {
          title: `New ${category} Request Nearby 🛒`,
          body: `${productDetails?.slice(0, 80)}`,
        },
        data: {
          postId: newPost._id.toString(),
          category: category,
          display_location: display_location || "",
          type: "NEW_POST_REQUEST",
        },
        tokens: fcmTokens,
      };

      const fcmResult = await admin
        .messaging()
        .sendEachForMulticast(fcmMessage);

      console.log(
        `✅ FCM sent: ${fcmResult.successCount} | ❌ Failed: ${fcmResult.failureCount}`,
      );

      const deadTokenIds = [];
      fcmResult.responses.forEach((resp, i) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            deadTokenIds.push(nearbySellers[i]._id);
          }
        }
      });

      if (deadTokenIds.length > 0) {
        await User.updateMany(
          { _id: { $in: deadTokenIds } },
          { $unset: { token: "" } },
        );
        console.log(`🧹 Cleared ${deadTokenIds.length} dead tokens`);
      }
    }

    return res.status(201).json({
      message: "Post created and nearby sellers notified.",
      post: newPost,
      sellers_found: nearbySellers.length,
      notified: fcmTokens.length,
    });
  } catch (error) {
    console.error("createPost error:", error);
    res
      .status(500)
      .json({ message: "Error adding post", error: error.message });
  }
});

router.post("/getPosts/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "sellerId is required" });
    }
    
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const shop_category = seller.shop_category;
    const lat = parseFloat(seller.location_coordinate.latitude);
    const lng = parseFloat(seller.location_coordinate.longitude);

    if (!shop_category || shop_category.length === 0) {
      return res.status(400).json({ message: "Seller has no shop categories" });
    }

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Seller has invalid location" });
    }

    const filterPost = await Post.find({ category: { $in: shop_category } });

    if (filterPost.length === 0) {
      return res.status(200).json([]);
    }

    const nearbyCustomers = filterPost.filter((customer) => {
      const customerLat = customer.location_coordinate?.latitude;
      const customerLng = customer.location_coordinate?.longitude;

      if (!customerLat || !customerLng) return false;

      const dist = getDistanceKm(lat, lng, customerLat, customerLng);

      return dist <= customer.radiusSearch;
    });

    if (nearbyCustomers.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(nearbyCustomers);

  } catch (error) {
    console.error("getPosts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/getRequest/:id", async (req, res) => {
  try {
    const getReq = await Post.findById({ _id: req.params.id });
    if (!getReq) return res.status(404).json([]);
    return res.status(200).json(getReq);
  } catch (error) {
    console.log({ Error: error });
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

