const express = require("express");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route here is admin-only
router.use(protect, authorize("admin"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
