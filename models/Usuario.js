const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Usuario', {
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  // Solo almacenar hashes de contraseñas, nunca contraseñas en texto plano.
  password: { type: DataTypes.STRING(255), allowNull: false },
  rol: { type: DataTypes.ENUM('Administrador', 'Almacenero'), allowNull: false, defaultValue: 'Almacenero' }
}, { tableName: 'usuarios', timestamps: true });
