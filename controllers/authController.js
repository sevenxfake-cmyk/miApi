const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { scryptSync, timingSafeEqual } = require('node:crypto');
const { Usuario } = require('../models/relaciones');

const correoValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const claveValida = (clave) => typeof clave === 'string' && clave.length >= 8 && Buffer.byteLength(clave) <= 72;

// Los administradores se crean desde la consola con npm run seed:admin.
// El registro público nunca permite asignarse un rol privilegiado.
exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body || {};
    const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
    const correo = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!nombreLimpio || nombreLimpio.length > 120 || !correoValido(correo) ||
        correo.length > 160 || !claveValida(password)) {
      return res.status(400).json({ error: 'Nombre, correo válido y contraseña de 8 a 72 bytes obligatorios.' });
    }
    if (await Usuario.findOne({ where: { email: correo } })) {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const usuario = await Usuario.create({
      nombre: nombreLimpio, email: correo, password: hash, rol: 'Almacenero'
    });
    res.status(201).json({ message: 'Usuario registrado.', id: usuario.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }
    next(error);
  }
};

function verificarHashAnterior(clave, hash) {
  const partes = String(hash || '').split(':');
  if (partes.length !== 3 || partes[0] !== 'scrypt' ||
      !/^[0-9a-f]{32}$/i.test(partes[1]) || !/^[0-9a-f]{128}$/i.test(partes[2])) return false;
  const esperado = Buffer.from(partes[2], 'hex');
  const calculado = scryptSync(clave, partes[1], esperado.length);
  return timingSafeEqual(esperado, calculado);
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Correo y contraseña obligatorios.' });
    }
    const usuario = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas.' });
    const hash = String(usuario.password);
    const correcto = hash.startsWith('scrypt:')
      ? verificarHashAnterior(password, hash)
      : await bcrypt.compare(password, hash);
    if (!correcto) return res.status(401).json({ error: 'Credenciales inválidas.' });

    // Conversión gradual: conserva los administradores existentes creados con scrypt.
    if (hash.startsWith('scrypt:')) {
      await usuario.update({ password: await bcrypt.hash(password, 12) });
    }
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );
    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (error) { next(error); }
};

exports.perfil = (req, res) => {
  res.json({ usuario: req.usuario });
};
