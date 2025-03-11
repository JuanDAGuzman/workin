# WorkIN - Backend API

Backend para la aplicación WorkIN, una plataforma para búsqueda y publicación de empleos.

## Tecnologías

- Node.js
- Express
- PostgreSQL
- JSON Web Tokens (JWT)
- Nodemailer (para emails)

## Estructura del Proyecto
src/
├── config/           # Configuración (DB, variables de entorno)
├── controllers/      # Controladores de la API
│   └── users/        # Controladores relacionados con usuarios
├── middleware/       # Middlewares personalizados
├── models/           # Modelos de datos
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio
├── utils/            # Utilidades y helpers
└── validations/      # Esquemas de validación

## Instalación

1. Clona el repositorio
git clone https://github.com/JuanDAGuzman/workin.git
cd workin

2. Instala las dependencias
npm install

3. Configura las variables de entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

PORT=5000
DB_USER=tu_usuario_postgres
DB_HOST=localhost
DB_NAME=workin
DB_PASSWORD=tu_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
NODE_ENV=development
Config para emails (Mailtrap para desarrollo)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=tu_usuario_mailtrap
MAIL_PASS=tu_password_mailtrap

4. Inicia el servidor

npm start

## Características

- Autenticación y autorización con JWT
- Verificación de cuenta por email
- Recuperación de contraseña
- Manejo de errores centralizado
- Validación de datos
- Estructura modular y mantenible

## API Endpoints

### Usuarios

- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión
- `GET /api/users/verify/:token` - Verificación de cuenta
- `POST /api/users/password-reset-request` - Solicitar cambio de contraseña
- `POST /api/users/password-reset/:token` - Confirmar cambio de contraseña
- `GET /api/users` - Obtener todos los usuarios (requiere autenticación)
- `GET /api/users/:id` - Obtener un usuario por ID (requiere autenticación)

### Empleos

- `GET /api/jobs` - Listar todos los empleos
- `POST /api/jobs` - Crear un nuevo empleo (requiere autenticación)
- `GET /api/jobs/:id` - Ver detalle de un empleo
- `PUT /api/jobs/:id` - Actualizar un empleo (requiere autenticación)
- `DELETE /api/jobs/:id` - Eliminar un empleo (requiere autenticación)

## Documentación

La documentación completa de la API está disponible a través de Postman.