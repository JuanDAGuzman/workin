const express = require('express');
const router = express.Router();
const authController = require('../controllers/users/authController');
const passwordController = require('../controllers/users/passwordController');
const profileController = require('../controllers/users/profileController');
const { validateUserRegistration, validateUserLogin, validatePasswordReset, validatePasswordResetRequest } = require('../validations/userValidations');
const { validateProfileUpdate, validateEmailChange, validatePasswordChange } = require('../validations/profileValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { getUserByEmail } = require('../controllers/users/userController');

// Rutas públicas
router.post('/register', validateUserRegistration, validateRequest, authController.createUser);
router.post('/login', validateUserLogin, validateRequest, authController.loginUser);
router.get('/verify/:token', authController.verifyUser);
router.post('/password-reset-request', validatePasswordResetRequest, validateRequest, passwordController.requestPasswordReset);
router.post('/password-reset/:token', validatePasswordReset, validateRequest, passwordController.resetPassword);

// Rutas de perfil (protegidas) 
router.get('/profile', protect, profileController.getUserProfile);
router.put('/profile', protect, validateProfileUpdate, validateRequest, profileController.updateUserProfile);
router.post('/profile/change-email', protect, validateEmailChange, validateRequest, profileController.requestEmailChange);
router.get('/profile/confirm-email/:token', profileController.confirmEmailChange);
router.post('/profile/change-password', protect, validatePasswordChange, validateRequest, profileController.changePassword);

// Ruta para obtener usuario por email
router.get('/email/:email', /* protect, */ getUserByEmail);

// Rutas protegidas generales
router.get('/', protect, authController.getUsers);
router.get('/:id', protect, authController.getUserById); 

module.exports = router;