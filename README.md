# WorkIN - Backend API

Backend para la aplicación WorkIN, una plataforma para búsqueda y publicación de empleos.

## Tecnologías

- Node.js
- Express
- PostgreSQL
- JSON Web Tokens (JWT)
- Nodemailer (para emails)
- ESLint (análisis estático de código)
- Spectral (análisis de API REST)

## Estructura del Proyecto

```
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
docs/
└── analysis/         # Documentación de análisis de calidad
```

## Instalación

1. Clona el repositorio
```bash
git clone https://github.com/JuanDAGuzman/workin.git
cd workin
```

2. Instala las dependencias
```bash
npm install
```

3. Configura las variables de entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
PORT=5000
DB_USER=tu_usuario_postgres
DB_HOST=localhost
DB_NAME=workin
DB_PASSWORD=tu_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
NODE_ENV=development
# Config para emails (Mailtrap para desarrollo)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=tu_usuario_mailtrap
MAIL_PASS=tu_password_mailtrap
```

4. Inicia el servidor
```bash
npm start
```

## Características

- Autenticación y autorización con JWT
- Verificación de cuenta por email
- Recuperación de contraseña
- Manejo de errores centralizado
- Validación de datos
- Estructura modular y mantenible
- Análisis estático de código con ESLint
- Evaluación de calidad de API REST

## API Endpoints

### Usuarios
- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión
- `GET /api/users/verify/:token` - Verificación de cuenta
- `POST /api/users/password-reset-request` - Solicitar cambio de contraseña
- `POST /api/users/password-reset/:token` - Confirmar cambio de contraseña
- `GET /api/users` - Obtener todos los usuarios (requiere autenticación)
- `GET /api/users/:id` - Obtener un usuario por ID (requiere autenticación)

### Perfil
- `GET /api/users/profile` - Ver perfil del usuario autenticado
- `PUT /api/users/profile` - Actualizar información del perfil
- `POST /api/users/profile/change-email` - Solicitar cambio de correo
- `GET /api/users/profile/confirm-email/:token` - Confirmar cambio de correo
- `POST /api/users/profile/change-password` - Cambiar contraseña

### Empleos
- `GET /api/jobs` - Listar todos los empleos
- `POST /api/jobs` - Crear un nuevo empleo (requiere autenticación)
- `GET /api/jobs/:id` - Ver detalle de un empleo
- `PUT /api/jobs/:id` - Actualizar un empleo (requiere autenticación)
- `DELETE /api/jobs/:id` - Eliminar un empleo (requiere autenticación)

### Empresas
- `POST /api/companies` - Crear empresa (requiere autenticación)
- `GET /api/companies/:id` - Obtener información de una empresa
- `PUT /api/companies/:id/verify` - Verificar una empresa (admin)

### Postulaciones
- `POST /api/applications` - Postular a un empleo
- `GET /api/applications/me` - Ver mis postulaciones
- `GET /api/applications/job/:id` - Ver postulaciones para un empleo (empresa)
- `PUT /api/applications/:id/status` - Actualizar estado de postulación
- `DELETE /api/applications/:id` - Eliminar postulación

### Valoraciones
- `POST /api/ratings` - Crear/actualizar valoración de empresa
- `GET /api/ratings/company/:id` - Ver valoraciones de una empresa
- `GET /api/ratings/me` - Ver mis valoraciones realizadas
- `DELETE /api/ratings/:id` - Eliminar una valoración

### Discapacidades
- `POST /api/disabilities` - Crear tipo de discapacidad (admin)
- `GET /api/disabilities` - Listar tipos de discapacidad
- `POST /api/disabilities/user` - Registrar discapacidad de usuario
- `GET /api/disabilities/user/me` - Ver mis discapacidades registradas

### Mensajes
- `GET /api/messages/conversations` - Ver todas mis conversaciones
- `GET /api/messages/conversation/:id` - Ver mensajes con un usuario específico
- `POST /api/messages` - Enviar un mensaje

### Soporte
- `POST /api/support` - Crear solicitud de soporte
- `GET /api/support/me` - Ver mis solicitudes (usuario)
- `GET /api/support` - Ver todas las solicitudes (admin)
- `POST /api/support/:id/respond` - Responder solicitud (admin)

## Análisis de Calidad

El proyecto implementa herramientas de análisis estático para mantener la calidad del código y del diseño de la API:

### ESLint

Se ha configurado ESLint para detectar problemas en el código JavaScript:

```bash
# Ejecutar análisis
npm run lint

# Corregir problemas automáticamente
npm run lint:fix
```

### Análisis de API REST

Se ha realizado un análisis teórico y práctico del diseño de la API REST, identificando buenas prácticas y áreas de mejora:

- Documentación en `/docs/analysis/ANÁLISIS DE CALIDAD DE APIS.md`
- Plan de mejora en `/docs/analysis/PLAN DE MEJORA DE API.md`

## Documentación

La documentación completa de la API está disponible a través de Postman. Adicionalmente, se incluye documentación sobre el análisis de calidad en la carpeta `/docs/analysis/`.