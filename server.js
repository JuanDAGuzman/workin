require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");
const routes = require("./src/routes/index");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

// gRPC
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

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

// Configurar Express
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use("/api", routes);
app.all('*', notFoundHandler);
app.use(errorHandler);

// Iniciar servidor Express
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor HTTP corriendo en http://localhost:${PORT}`);
});

// ======================= gRPC =======================

// Cargar el archivo .proto
const PROTO_PATH = "./user.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Implementar el servicio gRPC
const getUserByEmail = async (call, callback) => {
  try {
    const { email } = call.request;
    const query = "SELECT id, nombre, correo FROM users WHERE correo = $1";
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Usuario no encontrado"
      });
    }

    callback(null, result.rows[0]);
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: "Error en el servidor"
    });
  }
};

// Crear y arrancar el servidor gRPC
const grpcServer = new grpc.Server();
grpcServer.addService(userProto.UserService.service, { GetUserByEmail: getUserByEmail });

const GRPC_PORT = "0.0.0.0:50051";
grpcServer.bindAsync(GRPC_PORT, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`🟢 Servidor gRPC corriendo en ${GRPC_PORT}`);
  grpcServer.start();
});
