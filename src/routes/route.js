const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.createUser);
router.post("/login", userController.userLogin);
router.get("/user/:userId/profile", userController.getProfile);
// router.put("/user/:userId/profile", userController.updateUser);
router.put("/user/:userId/profile", userController.updateUser);

module.exports = router;
