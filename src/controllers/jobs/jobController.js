// src/controllers/jobs/jobController.js
const pool = require("../../config/db");
const { NotFoundError, ForbiddenError } = require("../../utils/errorClasses");

// Obtener todos los empleos con paginación y filtros
const getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      empresa_id,
      titulo,
      ordenar_por = "fecha_publicacion",
      orden = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Construir la consulta base - usando la tabla "empresas" en lugar de "companies"
    let query = `
      SELECT e.*, emp.nombre as nombre_empresa
      FROM empleos e
      LEFT JOIN empresas emp ON e.empresa_id = emp.id
      WHERE 1=1
    `;

    // Agregar filtros si existen
    const params = [];
    let paramCount = 1;

    if (empresa_id) {
      query += ` AND e.empresa_id = $${paramCount}`;
      params.push(empresa_id);
      paramCount++;
    }

    if (titulo) {
      query += ` AND e.titulo ILIKE $${paramCount}`;
      params.push(`%${titulo}%`);
      paramCount++;
    }

    // Agregar ordenamiento
    query += ` ORDER BY e.${ordenar_por} ${orden}`;

    // Agregar paginación
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // Consulta para contar total de resultados (sin paginación)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM empleos e
      WHERE 1=1
    `;

    // Agregar los mismos filtros a la consulta de conteo
    if (empresa_id) countQuery += ` AND e.empresa_id = $1`;
    if (titulo)
      countQuery += ` AND e.titulo ILIKE $${params.indexOf(titulo) + 1}`;

    // Ejecutar ambas consultas
    const jobsResult = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      empleos: jobsResult.rows,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un empleo por ID
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT e.*, emp.nombre as nombre_empresa
      FROM empleos e
      LEFT JOIN empresas emp ON e.empresa_id = emp.id
      WHERE e.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return next(new NotFoundError("Empleo no encontrado"));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const { titulo, descripcion, requisitos, empresa_id } = req.body;

    // Si es empresa, solo puede crear empleos para su propia empresa
    // Nota: En un sistema real, necesitarías una manera de relacionar usuarios con empresas

    const result = await pool.query(
      `
        INSERT INTO empleos (
          titulo, descripcion, requisitos, empresa_id, fecha_publicacion
        ) VALUES (
          $1, $2, $3, $4, NOW()
        ) RETURNING *
      `,
      [titulo, descripcion, requisitos, empresa_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Actualizar un empleo
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, requisitos } = req.body;

    // Verificar si el empleo existe
    const jobResult = await pool.query("SELECT * FROM empleos WHERE id = $1", [
      id,
    ]);

    if (jobResult.rows.length === 0) {
      return next(new NotFoundError("Empleo no encontrado"));
    }

    const job = jobResult.rows[0];

    // Verificar permisos (solo admin o empresa pueden actualizar)
    if (req.user.rol !== "admin" && req.user.rol !== "empresa") {
      return next(
        new ForbiddenError("No tienes permiso para actualizar este empleo")
      );
    }

    // Actualizar el empleo
    const result = await pool.query(
      `
      UPDATE empleos SET
        titulo = COALESCE($1, titulo),
        descripcion = COALESCE($2, descripcion),
        requisitos = COALESCE($3, requisitos)
      WHERE id = $4
      RETURNING *
    `,
      [titulo, descripcion, requisitos, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Eliminar un empleo
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si el empleo existe
    const jobResult = await pool.query("SELECT * FROM empleos WHERE id = $1", [
      id,
    ]);

    if (jobResult.rows.length === 0) {
      return next(new NotFoundError("Empleo no encontrado"));
    }

    // Verificar permisos
    if (req.user.rol !== "admin" && req.user.rol !== "empresa") {
      return next(
        new ForbiddenError("No tienes permiso para eliminar este empleo")
      );
    }

    // Eliminar el empleo
    await pool.query("DELETE FROM empleos WHERE id = $1", [id]);

    res.json({ message: "Empleo eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
