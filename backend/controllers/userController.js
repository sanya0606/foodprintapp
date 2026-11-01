const User = require("../models/User");

// @route  GET /api/users?role=
// @access Private (admin)
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch users", error: error.message });
  }
};

// @route  GET /api/users/:id
// @access Private (admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch user", error: error.message });
  }
};

// @route  PATCH /api/users/:id
// @access Private (admin) - update role / active status / org details
const updateUser = async (req, res) => {
  try {
    const { role, isActive, organizationName, location, name } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (organizationName !== undefined) user.organizationName = organizationName;
    if (location !== undefined) user.location = location;
    if (name) user.name = name;

    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Could not update user", error: error.message });
  }
};

// @route  DELETE /api/users/:id
// @access Private (admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    await user.deleteOne();
    return res.status(200).json({ message: "User removed" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete user", error: error.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
