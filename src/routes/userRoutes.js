const express = require('express');
const router = express.Router();
const authController = require('../controllers/users/authController');
const passwordController = require('../controllers/users/passwordController');
const { validateUserRegistration, validateUserLogin, validatePasswordReset, validatePasswordResetRequest } = require('../validations/userValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { getUserByEmail } = require('../controllers/users/userController'); // Nuevo controlador

//* Rutas públicas*
router.post('/register', validateUserRegistration, validateRequest, authController.createUser);
router.post('/login', validateUserLogin, validateRequest, authController.loginUser);
router.get('/verify/:token', authController.verifyUser);
router.post('/password-reset-request', validatePasswordResetRequest, validateRequest, passwordController.requestPasswordReset);
router.post('/password-reset/:token', validatePasswordReset, validateRequest, passwordController.resetPassword);

//* Nueva ruta para obtener usuario por email (protegida)*
router.get('/email/:email', protect, getUserByEmail);

//* Rutas protegidas (requieren autenticación)*
router.get('/', protect, authController.getUsers);
router.get('/:id', protect, authController.getUserById);

//* Aquí puedes agregar más rutas protegidas*
module.exports = router;
