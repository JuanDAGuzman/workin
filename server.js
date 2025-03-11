require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");
const routes = require("./src/routes/index");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

const app = express();

// Configurar la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Verificar la conexión a la base de datos
pool.connect()
  .then(() => console.log("🟢 Conectado a PostgreSQL"))
  .catch(err => console.error("🔴 Error de conexión a PostgreSQL", err));

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rutas
app.use("/api", routes);

// Manejar rutas no encontradas
app.all('*', notFoundHandler);

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});