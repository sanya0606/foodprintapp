const express = require("express");
const {
  createListing,
  getListings,
  getMyListings,
  getMyClaims,
  getStats,
  getListingById,
  updateListing,
  claimListing,
  deleteListing,
} = require("../controllers/foodController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getListings)
  .post(protect, authorize("provider", "admin"), createListing);

// Fixed paths must be declared before "/:id" so they aren't treated as an id
router.get("/mine", protect, authorize("provider", "admin"), getMyListings);
router.get("/claims/mine", protect, authorize("ngo", "student", "admin"), getMyClaims);
router.get("/stats", protect, getStats);

router
  .route("/:id")
  .get(protect, getListingById)
  .put(protect, authorize("provider", "admin"), updateListing)
  .delete(protect, deleteListing);

router.patch("/:id/claim", protect, authorize("ngo", "student", "admin"), claimListing);

module.exports = router;
