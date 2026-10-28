require('dotenv').config();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { Producto, Categoria, Proveedor } = require('../models/relaciones');

async function migrar() {
  await sequelize.authenticate();
  // Crea las tablas nuevas sin borrar ni alterar por fuerza los registros previos.
  await sequelize.sync({ force: false });

  const qi = sequelize.getQueryInterface();
  const table = Producto.getTableName();
  const campos = await qi.describeTable(table);

  if (!campos.categoria_id) {
    await qi.addColumn(table, 'categoria_id', {
      type: DataTypes.INTEGER, allowNull: true,
      references: { model: Categoria.getTableName(), key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'RESTRICT'
    });
    console.log('Columna categoria_id agregada a productos.');
  }

  if (!campos.proveedor_id) {
    await qi.addColumn(table, 'proveedor_id', {
      type: DataTypes.INTEGER, allowNull: true,
      references: { model: Proveedor.getTableName(), key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'RESTRICT'
    });
    console.log('Columna proveedor_id agregada a productos.');
  }

  // La categoría General permite conservar los productos del Lab #8.
  const [general] = await Categoria.findOrCreate({
    where: { nombre: 'General' },
    defaults: { descripcion: 'Productos existentes antes de la ampliacion del inventario' }
  });
  await Producto.update({ categoria_id: general.id }, { where: { categoria_id: null } });
  console.log('Migración terminada sin borrar productos existentes.');
}

migrar().catch(err => { console.error('Error de migración:', err); process.exitCode = 1; })
  .finally(() => sequelize.close());
