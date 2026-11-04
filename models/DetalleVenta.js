const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('DetalleVenta', {
  nombre_producto: { type: DataTypes.STRING(255), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  precio_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, { tableName: 'detalle_ventas', timestamps: false });
