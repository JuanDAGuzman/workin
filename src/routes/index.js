const express = require('express');
/*const { Pool } = require('pg');*/
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const companyRoutes = require('./companyRoutes');
const applicationRoutes = require('./applicationsRoutes');
const ratingRoutes = require('./ratingRoutes');
const disabilityRoutes = require('./disabilityRoutes');
const adminRoutes = require('./adminRoutes');
const messageRoutes = require('./messageRoutes');
const supportRoutes = require('./supportRoutes');

const router = express.Router();

// Configurar la conexión a PostgreSQL
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// Ruta de conexión a PostgreSQL
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/companies', companyRoutes);
router.use('/applications', applicationRoutes);
router.use('/ratings', ratingRoutes);
router.use('/disabilities', disabilityRoutes);
router.use('/admin', adminRoutes);
router.use('/messages', messageRoutes);
router.use('/support', supportRoutes);

// Exportar el router
module.exports = router;
