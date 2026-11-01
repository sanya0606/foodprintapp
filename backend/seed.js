// Populates the database with demo users and listings.
// Usage:  npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const FoodListing = require("./models/FoodListing");

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Clearing old data...");
  await FoodListing.deleteMany({});
  await User.deleteMany({});

  // Using create() (not insertMany) so the password-hashing hook runs
  const admin = await User.create({ name: "Admin User", email: "admin@foodprint.com", password: "admin123", role: "admin" });
  const provider1 = await User.create({ name: "Green Leaf Manager", email: "greenleaf@foodprint.com", password: "provider123", role: "provider", organizationName: "Green Leaf Canteen", location: "MG Road" });
  const provider2 = await User.create({ name: "Sunrise Baker", email: "sunrise@foodprint.com", password: "provider123", role: "provider", organizationName: "Sunrise Bakery", location: "Indiranagar" });
  const ngo = await User.create({ name: "Helping Hands", email: "ngo@foodprint.com", password: "ngo12345", role: "ngo", organizationName: "Helping Hands Foundation", location: "Koramangala" });
  await User.create({ name: "Student Volunteer", email: "student@foodprint.com", password: "student123", role: "student", location: "College Campus" });

  await FoodListing.create([
    { provider: provider1._id, foodName: "Vegetable Pulao", category: "cooked_meal", quantity: 25, unit: "servings", pickupWindowStart: hoursFromNow(1), pickupWindowEnd: hoursFromNow(4) },
    { provider: provider1._id, foodName: "Dal Rice Combo", category: "cooked_meal", quantity: 22, unit: "servings", pickupWindowStart: hoursFromNow(1), pickupWindowEnd: hoursFromNow(3), status: "claimed", claimedBy: ngo._id },
    { provider: provider2._id, foodName: "Assorted Pastries", category: "bakery", quantity: 40, unit: "packets", pickupWindowStart: hoursFromNow(2), pickupWindowEnd: hoursFromNow(6) },
    { provider: provider2._id, foodName: "Fresh Fruit Crates", category: "produce", quantity: 18, unit: "kg", pickupWindowStart: hoursFromNow(1), pickupWindowEnd: hoursFromNow(5), status: "claimed", claimedBy: ngo._id },
    { provider: provider1._id, foodName: "Packaged Sandwiches", category: "packaged", quantity: 30, unit: "packets", pickupWindowStart: hoursFromNow(1), pickupWindowEnd: hoursFromNow(5) },
  ]);

  // Past listings nobody claimed, so the AI has waste history to learn from
  await FoodListing.create([
    { provider: provider1._id, foodName: "Leftover Biryani", category: "cooked_meal", quantity: 30, unit: "servings", pickupWindowStart: hoursFromNow(-30), pickupWindowEnd: hoursFromNow(-26), status: "expired" },
    { provider: provider1._id, foodName: "Paneer Curry", category: "cooked_meal", quantity: 20, unit: "servings", pickupWindowStart: hoursFromNow(-54), pickupWindowEnd: hoursFromNow(-50), status: "expired" },
    { provider: provider2._id, foodName: "Day-old Bread", category: "bakery", quantity: 25, unit: "packets", pickupWindowStart: hoursFromNow(-28), pickupWindowEnd: hoursFromNow(-24), status: "expired" },
  ]);

  console.log("Seed complete. Demo logins:");
  console.log("  admin    admin@foodprint.com     / admin123");
  console.log("  provider greenleaf@foodprint.com / provider123");
  console.log("  ngo      ngo@foodprint.com       / ngo12345");
  console.log("  student  student@foodprint.com   / student123");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
