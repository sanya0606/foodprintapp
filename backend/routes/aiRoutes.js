const express = require("express");
const { getInsights, chat, analyze } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/insights", getInsights);
router.post("/chat", chat);
router.post("/analyze", analyze);

module.exports = router;
