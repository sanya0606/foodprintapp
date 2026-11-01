const FoodListing = require("../models/FoodListing");

// Marks any "available" listing whose pickup window has ended as "expired".
// Called before reads so statuses are always up to date without needing a cron job.
const expireOldListings = async () => {
  await FoodListing.updateMany(
    { status: "available", pickupWindowEnd: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
};

// @route  POST /api/food
// @access Private (provider, admin)
const createListing = async (req, res) => {
  try {
    const { foodName, category, quantity, unit, description, pickupWindowStart, pickupWindowEnd } = req.body;

    if (!foodName || !quantity || !pickupWindowStart || !pickupWindowEnd) {
      return res.status(400).json({ message: "Food name, quantity, and pickup window are required" });
    }
    if (new Date(pickupWindowEnd) <= new Date(pickupWindowStart)) {
      return res.status(400).json({ message: "Pickup end must be after pickup start" });
    }

    const listing = await FoodListing.create({
      provider: req.user._id,
      foodName,
      category,
      quantity,
      unit,
      description,
      pickupWindowStart,
      pickupWindowEnd,
    });

    return res.status(201).json(listing);
  } catch (error) {
    return res.status(500).json({ message: "Could not create listing", error: error.message });
  }
};

// @route  GET /api/food?category=&status=&from=&to=&search=
// @access Private
const getListings = async (req, res) => {
  try {
    await expireOldListings();

    const { category, status, from, to, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.foodName = { $regex: search, $options: "i" };
    if (from || to) {
      filter.pickupWindowStart = {};
      if (from) filter.pickupWindowStart.$gte = new Date(from);
      if (to) filter.pickupWindowStart.$lte = new Date(to);
    }

    const listings = await FoodListing.find(filter)
      .populate("provider", "name organizationName location")
      .sort({ createdAt: -1 });

    return res.status(200).json(listings);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch listings", error: error.message });
  }
};

// @route  GET /api/food/mine
// @access Private (provider) - listings published by the logged-in provider
const getMyListings = async (req, res) => {
  try {
    await expireOldListings();
    const listings = await FoodListing.find({ provider: req.user._id })
      .populate("claimedBy", "name organizationName")
      .sort({ createdAt: -1 });
    return res.status(200).json(listings);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch your listings", error: error.message });
  }
};

// @route  GET /api/food/claims/mine
// @access Private (ngo, student) - listings the logged-in user has claimed
const getMyClaims = async (req, res) => {
  try {
    const listings = await FoodListing.find({ claimedBy: req.user._id })
      .populate("provider", "name organizationName location")
      .sort({ updatedAt: -1 });
    return res.status(200).json(listings);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch your claims", error: error.message });
  }
};

// @route  GET /api/food/stats?category=&from=&to=
// @access Private - server-side aggregation for the analytics dashboard
const getStats = async (req, res) => {
  try {
    await expireOldListings();

    const { category, from, to } = req.query;
    const match = {};
    if (category) match.category = category;
    if (from || to) {
      match.pickupWindowStart = {};
      if (from) match.pickupWindowStart.$gte = new Date(from);
      if (to) match.pickupWindowStart.$lte = new Date(to);
    }

    const [byStatus, byCategory, overTime] = await Promise.all([
      FoodListing.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } },
      ]),
      FoodListing.aggregate([
        { $match: match },
        { $group: { _id: "$category", count: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } },
        { $sort: { count: -1 } },
      ]),
      FoodListing.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            claimed: { $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const statusMap = { available: 0, claimed: 0, expired: 0 };
    let totalListings = 0;
    let savedQuantity = 0;
    byStatus.forEach((row) => {
      statusMap[row._id] = row.count;
      totalListings += row.count;
      if (row._id === "claimed") savedQuantity = row.totalQuantity;
    });

    const completionRate = totalListings > 0 ? Math.round((statusMap.claimed / totalListings) * 100) : 0;

    return res.status(200).json({
      kpis: {
        totalListings,
        available: statusMap.available,
        claimed: statusMap.claimed,
        expired: statusMap.expired,
        savedQuantity,
        completionRate,
      },
      byCategory: byCategory.map((r) => ({ category: r._id, count: r.count, totalQuantity: r.totalQuantity })),
      overTime: overTime.map((r) => ({ date: r._id, count: r.count, claimed: r.claimed })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not compute stats", error: error.message });
  }
};

// @route  GET /api/food/:id
// @access Private
const getListingById = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id).populate(
      "provider",
      "name organizationName location"
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.status(200).json(listing);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch listing", error: error.message });
  }
};

// @route  PUT /api/food/:id
// @access Private (owning provider or admin) - edit a listing that is still available
const updateListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this listing" });
    }
    if (listing.status !== "available") {
      return res.status(400).json({ message: "Only available listings can be edited" });
    }

    const fields = ["foodName", "category", "quantity", "unit", "description", "pickupWindowStart", "pickupWindowEnd"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) listing[f] = req.body[f];
    });

    if (new Date(listing.pickupWindowEnd) <= new Date(listing.pickupWindowStart)) {
      return res.status(400).json({ message: "Pickup end must be after pickup start" });
    }

    await listing.save();
    return res.status(200).json(listing);
  } catch (error) {
    return res.status(500).json({ message: "Could not update listing", error: error.message });
  }
};

// @route  PATCH /api/food/:id/claim
// @access Private (ngo, student, admin)
const claimListing = async (req, res) => {
  try {
    await expireOldListings();
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.status !== "available") {
      return res.status(400).json({ message: "This listing is no longer available" });
    }

    listing.status = "claimed";
    listing.claimedBy = req.user._id;
    await listing.save();

    return res.status(200).json(listing);
  } catch (error) {
    return res.status(500).json({ message: "Could not claim listing", error: error.message });
  }
};

// @route  DELETE /api/food/:id
// @access Private (owning provider or admin)
const deleteListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this listing" });
    }

    await listing.deleteOne();
    return res.status(200).json({ message: "Listing removed" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete listing", error: error.message });
  }
};

module.exports = {
  createListing,
  getListings,
  getMyListings,
  getMyClaims,
  getStats,
  getListingById,
  updateListing,
  claimListing,
  deleteListing,
};
