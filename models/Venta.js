const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Comprobante de control interno, NO es un comprobante tributario SUNAT.
module.exports = sequelize.define('Venta', {
  cliente_nombre: { type: DataTypes.STRING(150), allowNull: false, defaultValue: 'Cliente general' },
  cliente_documento: { type: DataTypes.STRING(20), allowNull: true },
  metodo_pago: { type: DataTypes.ENUM('Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Otro'), allowNull: false, defaultValue: 'Efectivo' },
  total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  estado: { type: DataTypes.ENUM('Emitida', 'Anulada'), allowNull: false, defaultValue: 'Emitida' },
  motivo_anulacion: { type: DataTypes.STRING(250), allowNull: true },
  anulada_en: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'ventas', timestamps: true });
