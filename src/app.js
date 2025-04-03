const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const companyRoutes = require('./routes/companyRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const supportRoutes = require('./routes/supportRoutes');

// Usar las rutas
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/support', supportRoutes);

// Manejar rutas no encontradas
app.all('*', notFoundHandler);

// Middleware de manejo de errores 
app.use(errorHandler);

module.exports = app;