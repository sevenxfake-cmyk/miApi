const Producto = require('./Producto');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Movimiento = require('./Movimiento');

Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria', onDelete: 'RESTRICT' });

Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor', onDelete: 'RESTRICT' });

Producto.hasMany(Movimiento, { foreignKey: { name: 'producto_id', allowNull: false }, as: 'movimientos' });
Movimiento.belongsTo(Producto, { foreignKey: { name: 'producto_id', allowNull: false }, as: 'producto', onDelete: 'RESTRICT' });

Usuario.hasMany(Movimiento, { foreignKey: { name: 'usuario_id', allowNull: false }, as: 'movimientos' });
Movimiento.belongsTo(Usuario, { foreignKey: { name: 'usuario_id', allowNull: false }, as: 'usuario', onDelete: 'RESTRICT' });

module.exports = { Producto, Categoria, Proveedor, Usuario, Movimiento };
