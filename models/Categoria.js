const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Categoria', {
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'categorias', timestamps: true });
