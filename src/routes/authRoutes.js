const express = require("express");
const { createUser, loginUser, verifyUser } = require("../controllers/users/authController");

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyUser); // Asegúrate de que verifyUser está definido

module.exports = router;
