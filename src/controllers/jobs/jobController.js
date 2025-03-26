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
      salario_min,
      salario_max,
      ordenar_por = "fecha_publicacion",
      orden = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Construir la consulta base
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

    if (salario_min) {
      query += ` AND e.salario >= $${paramCount}`;
      params.push(salario_min);
      paramCount++;
    }

    if (salario_max) {
      query += ` AND e.salario <= $${paramCount}`;
      params.push(salario_max);
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
    if (salario_min)
      countQuery += ` AND e.salario >= $${params.indexOf(salario_min) + 1}`;
    if (salario_max)
      countQuery += ` AND e.salario <= $${params.indexOf(salario_max) + 1}`;

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
    const { titulo, descripcion, requisitos, salario, empresa_id } = req.body;

    // Verificar si el usuario es parte de la empresa o es admin
    if (req.user.rol !== "admin" && req.user.rol !== "empresa") {
      return next(
        new ForbiddenError("No tienes permiso para publicar empleos")
      );
    }

    // Si es empresa, solo puede crear empleos para su propia empresa
    if (req.user.rol === "empresa" && req.user.empresa_id != empresa_id) {
      return next(
        new ForbiddenError("Solo puede crear empleos para su propia empresa")
      );
    }

    if (req.user.rol !== "admin") {
      const companyResult = await pool.query(
        "SELECT verificada FROM empresas WHERE id = $1",
        [empresa_id]
      );

      if (companyResult.rows.length === 0) {
        return next(new NotFoundError("Empresa no encontrada"));
      }

      if (!companyResult.rows[0].verificada) {
        return next(
          new ForbiddenError(
            "Tu empresa aún no ha sido verificada. No puedes publicar empleos hasta que un administrador verifique tu empresa."
          )
        );
      }
    }

    const result = await pool.query(
      `
      INSERT INTO empleos (
        titulo, descripcion, requisitos, salario, empresa_id, fecha_publicacion
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      ) RETURNING *
    `,
      [titulo, descripcion, requisitos, salario, empresa_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, requisitos, salario } = req.body;

    // Verificar si el empleo existe
    const jobResult = await pool.query("SELECT * FROM empleos WHERE id = $1", [
      id,
    ]);

    if (jobResult.rows.length === 0) {
      return next(new NotFoundError("Empleo no encontrado"));
    }

    const job = jobResult.rows[0];

    // Verificar permisos (solo admin o empresa pueden actualizar)
    if (
      req.user.rol !== "admin" &&
      (req.user.rol !== "empresa" || req.user.empresa_id != job.empresa_id)
    ) {
      return next(
        new ForbiddenError("No tienes permiso para actualizar este empleo")
      );
    }

    const result = await pool.query(
      `
      UPDATE empleos SET
        titulo = COALESCE($1, titulo),
        descripcion = COALESCE($2, descripcion),
        requisitos = COALESCE($3, requisitos),
        salario = COALESCE($4, salario)
      WHERE id = $5
      RETURNING *
    `,
      [titulo, descripcion, requisitos, salario, id]
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

    const jobResult = await pool.query("SELECT * FROM empleos WHERE id = $1", [
      id,
    ]);

    if (jobResult.rows.length === 0) {
      return next(new NotFoundError("Empleo no encontrado"));
    }

    const job = jobResult.rows[0];

    if (
      req.user.rol !== "admin" &&
      (req.user.rol !== "empresa" || req.user.empresa_id != job.empresa_id)
    ) {
      return next(
        new ForbiddenError("No tienes permiso para eliminar este empleo")
      );
    }

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
