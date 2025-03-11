const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

// Ruta al archivo .proto
const PROTO_PATH = path.join(__dirname, "proto", "workin.proto");

// Cargar el archivo .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const workinProto = grpcObject.workin;

// Configurar PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Implementar los métodos gRPC
const server = new grpc.Server();

server.addService(workinProto.UserService.service, {
  GetUser: async (call, callback) => {
    try {
      const { id } = call.request;
      const result = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [id]);
      if (result.rows.length > 0) {
        callback(null, result.rows[0]);
      } else {
        callback({ code: grpc.status.NOT_FOUND, details: "Usuario no encontrado" });
      }
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  CreateUser: async (call, callback) => {
    try {
      const { name, email, password } = call.request;
      const result = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
        [name, email, password]
      );
      callback(null, result.rows[0]);
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  }
});

// 🟢 Habilitar reflexión manualmente
const protoContent = fs.readFileSync(PROTO_PATH, "utf-8");
const fileDescriptorSet = {
  file: [
    {
      name: "workin.proto",
      content: protoContent,
    },
  ],
};

server.addService({
  ServerReflectionInfo: (call) => {
    call.on("data", (message) => {
      call.write({ file_descriptor_response: fileDescriptorSet });
    });
    call.on("end", () => call.end());
  },
});

// Iniciar el servidor
server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
  console.log("🟢 Servidor gRPC corriendo en el puerto 50051");
});