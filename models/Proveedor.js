const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Proveedor', {
  razon_social: { type: DataTypes.STRING(160), allowNull: false },
  contacto: { type: DataTypes.STRING(120), allowNull: true },
  telefono: { type: DataTypes.STRING(30), allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: true, validate: { isEmailOrEmpty(value) { if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Correo invalido'); } } }
}, { tableName: 'proveedores', timestamps: true });
