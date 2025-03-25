// src/controllers/companies/companyController.js
const pool = require('../../config/db');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../utils/errorClasses');

// Obtener todas las empresas
const getCompanies = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, fecha_creacion, calificacion 
      FROM empresas
      ORDER BY nombre
    `);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Obtener una empresa por ID
const getCompanyById = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT id, nombre, fecha_creacion, calificacion
      FROM empresas
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }
    
    // Obtener empleos activos de la empresa
    const jobsResult = await pool.query(`
      SELECT id, titulo, descripcion, fecha_publicacion
      FROM empleos
      WHERE empresa_id = $1
      ORDER BY fecha_publicacion DESC
    `, [id]);
    
    // Combinar datos
    const company = {
      ...result.rows[0],
      empleos: jobsResult.rows
    };
    
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// Crear una nueva empresa
const createCompany = async (req, res, next) => {
  const { nombre } = req.body;
  const userId = req.user.id;
  
  try {
    // Verificar si ya existe una empresa con el mismo nombre
    const existingCompany = await pool.query(
      'SELECT id FROM empresas WHERE nombre = $1',
      [nombre]
    );
    
    if (existingCompany.rows.length > 0) {
      return next(new ConflictError('Ya existe una empresa con este nombre'));
    }
    
    // Iniciar una transacción
    await pool.query('BEGIN');
    
    try {
      // Crear la empresa
      const companyResult = await pool.query(`
        INSERT INTO empresas (nombre, fecha_creacion)
        VALUES ($1, NOW())
        RETURNING id, nombre, fecha_creacion
      `, [nombre]);
      
      const company = companyResult.rows[0];
      
      // Actualizar el usuario para asignarle el rol de empresa
      await pool.query(`
        UPDATE users
        SET rol = 'empresa', empresa_id = $1
        WHERE id = $2
      `, [company.id, userId]);
      
      // Confirmar la transacción
      await pool.query('COMMIT');
      
      res.status(201).json({
        message: 'Empresa creada correctamente',
        company
      });
    } catch (error) {
      // Revertir la transacción en caso de error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Actualizar una empresa
const updateCompany = async (req, res, next) => {
  const { id } = req.params;
  const { nombre } = req.body;
  
  try {
    // Verificar si la empresa existe
    const companyResult = await pool.query(
      'SELECT id FROM empresas WHERE id = $1',
      [id]
    );
    
    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }
    
    // Verificar permisos (solo el propietario o admin puede actualizar)
    if (req.user.rol !== 'admin' && (req.user.rol !== 'empresa' || req.user.empresa_id != id)) {
      return next(new ForbiddenError('No tiene permisos para actualizar esta empresa'));
    }
    
    // Actualizar la empresa
    const result = await pool.query(`
      UPDATE empresas
      SET nombre = COALESCE($1, nombre)
      WHERE id = $2
      RETURNING id, nombre, fecha_creacion
    `, [nombre, id]);
    
    res.json({
      message: 'Empresa actualizada correctamente',
      company: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una empresa (solo admin)
const deleteCompany = async (req, res, next) => {
  const { id } = req.params;
  
  try {
    // Verificar si la empresa existe
    const companyResult = await pool.query(
      'SELECT id FROM empresas WHERE id = $1',
      [id]
    );
    
    if (companyResult.rows.length === 0) {
      return next(new NotFoundError('Empresa no encontrada'));
    }
    
    // Solo administradores pueden eliminar empresas
    if (req.user.rol !== 'admin') {
      return next(new ForbiddenError('No tiene permisos para eliminar empresas'));
    }
    
    // Eliminar la empresa
    await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
    
    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};