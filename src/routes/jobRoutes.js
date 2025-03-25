const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobs/jobController');
const { validateJobCreation, validateJobUpdate } = require('../validations/jobValidations');
const { validateRequest } = require('../middleware/validationMiddleware');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

// Rutas protegidas - requieren rol de admin o empresa
router.post('/', protect, restrictTo('admin', 'empresa'), validateJobCreation, validateRequest, jobController.createJob);
router.put('/:id', protect, restrictTo('admin', 'empresa'), validateJobUpdate, validateRequest, jobController.updateJob);
router.delete('/:id', protect, restrictTo('admin', 'empresa'), jobController.deleteJob);

module.exports = router;