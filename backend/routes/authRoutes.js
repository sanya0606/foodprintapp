const express = require("express");
const { registerUser, loginUser, getMe, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.route("/me").get(protect, getMe).patch(protect, updateMe);

module.exports = router;
