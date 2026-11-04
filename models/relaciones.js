const Producto = require('./Producto');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Movimiento = require('./Movimiento');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');

Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria', onDelete: 'RESTRICT' });

Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor', onDelete: 'RESTRICT' });

Producto.hasMany(Movimiento, { foreignKey: { name: 'producto_id', allowNull: false }, as: 'movimientos' });
Movimiento.belongsTo(Producto, { foreignKey: { name: 'producto_id', allowNull: false }, as: 'producto', onDelete: 'RESTRICT' });

Usuario.hasMany(Movimiento, { foreignKey: { name: 'usuario_id', allowNull: false }, as: 'movimientos' });
Movimiento.belongsTo(Usuario, { foreignKey: { name: 'usuario_id', allowNull: false }, as: 'usuario', onDelete: 'RESTRICT' });

Usuario.hasMany(Venta, { foreignKey: { name: 'vendedor_id', allowNull: false }, as: 'ventas' });
Venta.belongsTo(Usuario, { foreignKey: { name: 'vendedor_id', allowNull: false }, as: 'vendedor', onDelete: 'RESTRICT' });
Venta.hasMany(DetalleVenta, { foreignKey: { name: 'venta_id', allowNull: false }, as: 'detalles' });
DetalleVenta.belongsTo(Venta, { foreignKey: { name: 'venta_id', allowNull: false }, as: 'venta', onDelete: 'RESTRICT' });
Producto.hasMany(DetalleVenta, { foreignKey: { name: 'producto_id', allowNull: false }, as: 'ventas_detalle' });
DetalleVenta.belongsTo(Producto, { foreignKey: { name: 'producto_id', allowNull: false }, as: 'producto', onDelete: 'RESTRICT' });

module.exports = { Producto, Categoria, Proveedor, Usuario, Movimiento, Venta, DetalleVenta };
