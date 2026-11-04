const jwt = require('jsonwebtoken');
const { Usuario } = require('../models/relaciones');

module.exports = (rolesPermitidos = []) => async (req, res, next) => {
  const encabezado = req.get('authorization') || '';
  const encontrado = /^Bearer\s+([^\s]+)$/i.exec(encabezado);
  if (!encontrado) return res.status(401).json({ error: 'Token de acceso requerido.' });
  try {
    const payload = jwt.verify(encontrado[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    if (!Number.isInteger(payload.id)) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    const usuario = await Usuario.findByPk(payload.id, {
      attributes: ['id', 'nombre', 'email', 'rol']
    });
    if (!usuario) return res.status(401).json({ error: 'Usuario no disponible.' });
    if (rolesPermitidos.length && !rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
    }
    req.usuario = usuario.toJSON();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ||
        error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }
    next(error);
  }
};
