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

// this is basically use for this to find the all use accoridng the radius and then send notification 
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
      .json({ message: error.message });
  }
});

// accepted Request by seller 
router.post("/acceptRequest/:id", async (req, res) => {
  try {
    const updatePost = await Post.findByIdAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true },
    );

    if (!updatePost) {
      return res.status(404).json({ message: "Post not found" });
    }

    const customer = await User.findById(updatePost.createdBy);

    if (customer?.token) {
      const fcmMessage = {
        notification: {
          title: "Your Request has been Accepted! 🎉",
          body: `A seller has accepted your ${updatePost.category} request.`,
        },
        data: {
          postId: updatePost._id.toString(),
          category: updatePost.category,
          type: "REQUEST_ACCEPTED",
        },
        token: customer.token, 
      };

      try {
        await admin.messaging().send(fcmMessage);
        console.log("✅ FCM notification sent to customer");
      } catch (fcmError) {
        const code = fcmError?.errorInfo?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          await User.findByIdAndUpdate(customer._id, { $unset: { token: "" } });
          console.log("🧹 Cleared dead customer token");
        } else {
          console.error("FCM error:", fcmError.message);
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Post updated successfully", post: updatePost });
  } catch (error) {
    console.error("acceptRequest error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
// by accessing seller
router.post("/getPosts", async (req, res) => {
  const { shop_category, location_coordinate } = req.body;

  if (!shop_category || !location_coordinate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Filter by the category
    const filteredPosts = await Post.find({
      category: { $in: shop_category },
    });

    if (filteredPosts.length === 0) {
      return res.status(200).json([]);
    }

    // Filter by distance
    const nearbyPosts = filteredPosts.filter((post) => {
      const postLat = post.location_coordinate.latitude;
      const postLng = post.location_coordinate.longitude;

      const dist = getDistanceKm(
        postLat,
        postLng,
        location_coordinate.latitude,
        location_coordinate.longitude
      );

      return dist <= post.radiusSearch;
    });

    return res.status(200).json(nearbyPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// access post by the id 
router.get("/getOwnPost/:id", async (req, res) => {
  try {
    const allPost = await Post.find({ createdBy: req.params.id });
    if (!allPost) {
      return res.status(200).json([]);
    }
    return res.status(200).json(allPost);
  } catch (error) {
    console.log({ Error: error });
  }
});


// accessing by the id
router.get("/getRequest/:id", async (req, res) => {
  try {
    const getReq = await Post.findById({ _id: req.params.id });
    if (!getReq) return res.status(404).json([]);
    return res.status(200).json(getReq);
  } catch (error) {
    console.log({ Error: error });
  }
});

// update  by the id  
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

// delete by the id 
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

