const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Movimiento', {
  tipo_movimiento: { type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  fecha_hora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  stock_anterior: { type: DataTypes.INTEGER, allowNull: false },
  stock_nuevo: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'movimientos', timestamps: false });
