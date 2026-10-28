const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Producto, Categoria, Proveedor, Usuario, Movimiento } = require('../models/relaciones');

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const entero = (n) => Number.isInteger(Number(n)) && Number(n) > 0;
const texto = (s) => typeof s === 'string' && s.trim().length > 0;
const payloadProducto = (body) => ({
  nombre: body.nombre.trim(), descripcion: body.descripcion || '',
  precio: Number(body.precio), categoria_id: Number(body.categoria_id),
  proveedor_id: body.proveedor_id ? Number(body.proveedor_id) : null
});

module.exports = function registrarRutas(app) {
  // CATEGORÍAS
  app.get('/categorias', asyncRoute(async (req, res) => res.json(await Categoria.findAll({ order: [['nombre', 'ASC']] }))));
  app.post('/categorias', asyncRoute(async (req, res) => {
    if (!texto(req.body.nombre)) return res.status(400).json({ error: 'Nombre obligatorio' });
    res.status(201).json(await Categoria.create({ nombre: req.body.nombre.trim(), descripcion: req.body.descripcion || '' }));
  }));
  app.put('/categorias/:id', asyncRoute(async (req, res) => {
    const obj = await Categoria.findByPk(req.params.id);
    if (!obj) return res.status(404).json({ error: 'Categoría no encontrada' });
    if (!texto(req.body.nombre)) return res.status(400).json({ error: 'Nombre obligatorio' });
    await obj.update({ nombre: req.body.nombre.trim(), descripcion: req.body.descripcion || '' });
    res.json(obj);
  }));
  app.delete('/categorias/:id', asyncRoute(async (req, res) => {
    const obj = await Categoria.findByPk(req.params.id);
    if (!obj) return res.status(404).json({ error: 'Categoría no encontrada' });
    if (await Producto.count({ where: { categoria_id: obj.id } })) {
      return res.status(409).json({ error: 'Esta categoría tiene productos asociados' });
    }
    await obj.destroy();
    res.json({ message: 'Categoría eliminada' });
  }));

  // PROVEEDORES
  app.get('/proveedores', asyncRoute(async (req, res) => res.json(await Proveedor.findAll({ order: [['razon_social', 'ASC']] }))));
  app.post('/proveedores', asyncRoute(async (req, res) => {
    if (!texto(req.body.razon_social)) return res.status(400).json({ error: 'Razón social obligatoria' });
    res.status(201).json(await Proveedor.create({
      razon_social: req.body.razon_social.trim(), contacto: req.body.contacto || '',
      telefono: req.body.telefono || '', email: req.body.email || ''
    }));
  }));
  app.put('/proveedores/:id', asyncRoute(async (req, res) => {
    const obj = await Proveedor.findByPk(req.params.id);
    if (!obj) return res.status(404).json({ error: 'Proveedor no encontrado' });
    if (!texto(req.body.razon_social)) return res.status(400).json({ error: 'Razón social obligatoria' });
    await obj.update({
      razon_social: req.body.razon_social.trim(), contacto: req.body.contacto || '',
      telefono: req.body.telefono || '', email: req.body.email || ''
    });
    res.json(obj);
  }));
  app.delete('/proveedores/:id', asyncRoute(async (req, res) => {
    const obj = await Proveedor.findByPk(req.params.id);
    if (!obj) return res.status(404).json({ error: 'Proveedor no encontrado' });
    if (await Producto.count({ where: { proveedor_id: obj.id } })) {
      return res.status(409).json({ error: 'El proveedor tiene productos asociados' });
    }
    await obj.destroy();
    res.json({ message: 'Proveedor eliminado' });
  }));

  // PRODUCTOS: no cambiar stock directamente. Se actualiza desde Kardex.
  const incluye = [
    { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
    { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
  ];
  app.get('/productos', asyncRoute(async (req, res) => {
    res.json(await Producto.findAll({ include: incluye, order: [['id', 'DESC']] }));
  }));
  app.post('/productos', asyncRoute(async (req, res) => {
    if (!texto(req.body.nombre) || !entero(req.body.categoria_id) ||
        !Number.isFinite(Number(req.body.precio)) || Number(req.body.precio) < 0 || req.body.precio === '') {
      return res.status(400).json({ error: 'Nombre, categoría y precio válido obligatorios' });
    }
    if (!await Categoria.findByPk(req.body.categoria_id)) return res.status(400).json({ error: 'La categoría no existe' });
    if (req.body.proveedor_id && !await Proveedor.findByPk(req.body.proveedor_id)) return res.status(400).json({ error: 'El proveedor no existe' });
    const nuevo = await Producto.create({ ...payloadProducto(req.body), stock: 0 });
    res.status(201).json(nuevo);
  }));
  app.put('/productos/:id', asyncRoute(async (req, res) => {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (req.body.stock !== undefined) return res.status(400).json({ error: 'Modifica el stock desde Kardex' });
    if (!texto(req.body.nombre) || !entero(req.body.categoria_id) ||
        !Number.isFinite(Number(req.body.precio)) || Number(req.body.precio) < 0 || req.body.precio === '') {
      return res.status(400).json({ error: 'Nombre, categoría y precio válido obligatorios' });
    }
    if (!await Categoria.findByPk(req.body.categoria_id)) return res.status(400).json({ error: 'La categoría no existe' });
    if (req.body.proveedor_id && !await Proveedor.findByPk(req.body.proveedor_id)) return res.status(400).json({ error: 'El proveedor no existe' });
    await producto.update(payloadProducto(req.body));
    res.json(producto);
  }));
  app.delete('/productos/:id', asyncRoute(async (req, res) => {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (await Movimiento.count({ where: { producto_id: producto.id } })) {
      return res.status(409).json({ error: 'No se puede eliminar un producto con historial Kardex' });
    }
    await producto.destroy();
    res.json({ message: 'Producto eliminado' });
  }));

  // USUARIOS: se devuelven datos básicos para asignar responsable al movimiento.
  // Sin login todavía; no implementar una lista de contraseñas ni rutas públicas de alta.
  app.get('/usuarios', asyncRoute(async (req, res) => {
    res.json(await Usuario.findAll({ attributes: ['id', 'nombre', 'rol'], order: [['nombre', 'ASC']] }));
  }));

  // KARDEX: movimiento y actualización de stock en UNA transacción.
  app.get('/movimientos', asyncRoute(async (req, res) => {
    res.json(await Movimiento.findAll({
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
      ],
      order: [['fecha_hora', 'DESC'], ['id', 'DESC']], limit: 300
    }));
  }));
  app.post('/movimientos', asyncRoute(async (req, res) => {
    const { producto_id, usuario_id, tipo_movimiento, cantidad, observaciones } = req.body;
    const tipos = ['Entrada', 'Salida', 'Ajuste'];
    const cantidadValida = Number.isInteger(Number(cantidad)) && Number(cantidad) >= 0 && cantidad !== '';
    if (!entero(producto_id) || !entero(usuario_id) || !tipos.includes(tipo_movimiento) ||
        !cantidadValida || (tipo_movimiento !== 'Ajuste' && Number(cantidad) === 0)) {
      return res.status(400).json({ error: 'Movimiento inválido: revisa producto, usuario, tipo y cantidad' });
    }
    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) return res.status(400).json({ error: 'El usuario responsable no existe' });

    let movimiento;
    try {
      movimiento = await sequelize.transaction(async (t) => {
        // El bloqueo evita que dos movimientos simultáneos sobrescriban el stock.
        const producto = await Producto.findByPk(producto_id, {
          transaction: t, lock: t.LOCK.UPDATE
        });
        if (!producto) {
          const error = new Error('El producto no existe'); error.status = 404; throw error;
        }
        const anterior = Number(producto.stock);
        let nuevo = anterior;
        if (tipo_movimiento === 'Entrada') nuevo += Number(cantidad);
        if (tipo_movimiento === 'Salida') nuevo -= Number(cantidad);
        // Ajuste: cantidad representa el stock final que debe quedar.
        if (tipo_movimiento === 'Ajuste') nuevo = Number(cantidad);
        if (nuevo < 0) {
          const error = new Error('Stock insuficiente para registrar una salida'); error.status = 409; throw error;
        }
        const registro = await Movimiento.create({
          producto_id, usuario_id, tipo_movimiento,
          cantidad: Number(cantidad), observaciones: observaciones || '',
          stock_anterior: anterior, stock_nuevo: nuevo
        }, { transaction: t });
        await producto.update({ stock: nuevo }, { transaction: t });
        return registro;
      });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    }
    res.status(201).json(movimiento);
  }));

  // DASHBOARD
  app.get('/dashboard/resumen', asyncRoute(async (req, res) => {
    const [totalProductos, bajoStock, totalCategorias, totalProveedores, totalMovimientos] = await Promise.all([
      Producto.count(), Producto.count({ where: { stock: { [Op.lte]: 5 } } }),
      Categoria.count(), Proveedor.count(), Movimiento.count()
    ]);
    res.json({ totalProductos, bajoStock, totalCategorias, totalProveedores, totalMovimientos });
  }));

  app.use((err, req, res, next) => {
    console.error(err);
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  });
};
