const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Conserva el nombre de tabla del Laboratorio #7: Productos.
module.exports = sequelize.define('Producto', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  // La API obliga a seleccionar una categoría existente.
  // La migración rellena las categorías de los productos antiguos.
  categoria_id: { type: DataTypes.INTEGER, allowNull: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });
