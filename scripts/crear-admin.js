require('dotenv').config();
const { randomBytes, scryptSync } = require('node:crypto');
const sequelize = require('../config/db');
const { Usuario } = require('../models/relaciones');
async function crear() {
  const nombre = (process.env.ADMIN_NAME || '').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const clave = process.env.ADMIN_PASSWORD || '';
  if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || clave.length < 8) {
    throw new Error('Configura ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (minimo 8 caracteres) en .env');
  }
  if (await Usuario.findOne({ where: { email } })) {
    console.log('El usuario ya existe. No se ha modificado.');
    return;
  }
  const salt = randomBytes(16).toString('hex');
  const password = 'scrypt:' + salt + ':' + scryptSync(clave, salt, 64).toString('hex');
  await Usuario.create({ nombre, email, password, rol: 'Administrador' });
  console.log('Usuario administrador creado con contraseña protegida por hash.');
}
crear().catch(err => { console.error(err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
