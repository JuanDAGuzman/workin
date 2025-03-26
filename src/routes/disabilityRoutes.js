const express = require("express");
const router = express.Router();
const disabilityController = require("../controllers/disabilities/disabilityController");
const userDisabilityController = require("../controllers/users/userDisabilityController");
const {
  validateDisabilityCreation,
  validateUserDisabilityRegister,
  validateUserDisabilityUpdate,
  validateDisabilityVerification,
} = require("../validations/disabilityValidations");
const { validateRequest } = require("../middleware/validationMiddleware");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// Rutas para discapacidades generales
router.get("/", disabilityController.getAllDisabilities);
router.get("/:id", disabilityController.getDisabilityById);
router.post(
  "/",
  protect,
  restrictTo("admin"),
  validateDisabilityCreation,
  validateRequest,
  disabilityController.createDisability
);

// Ruta rápida para verificar discapacidad (solo admin)
router.post(
  "/user/:id/quick-verify",
  protect,
  restrictTo("admin"),
  userDisabilityController.quickVerifyUserDisability
);

// Rutas para asociación de discapacidades con usuarios
router.get("/user/me", protect, userDisabilityController.getUserDisabilities);
router.get(
  "/user/:id",
  protect,
  userDisabilityController.getUserDisabilitiesById
);
router.post(
  "/user",
  protect,
  validateUserDisabilityRegister,
  validateRequest,
  userDisabilityController.registerUserDisability
);
router.put(
  "/user/:id",
  protect,
  validateUserDisabilityUpdate,
  validateRequest,
  userDisabilityController.updateUserDisability
);
router.delete(
  "/user/:id",
  protect,
  userDisabilityController.deleteUserDisability
);


module.exports = router;
