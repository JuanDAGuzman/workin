const express = require("express");
const { Pool } = require("pg");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");

const router = express.Router();

// Configurar la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Ruta de conexión a PostgreSQL
router.use("/users", userRoutes);
router.use("/auth", authRoutes);

module.exports = router;
