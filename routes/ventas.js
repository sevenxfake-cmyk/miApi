const { Router } = require('express');
const sequelize = require('../config/db');
const { Venta, DetalleVenta, Producto, Usuario, Movimiento } = require('../models/relaciones');

const router = Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fallo = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });
const detalles = [{ model: DetalleVenta, as: 'detalles', attributes: ['id', 'producto_id', 'nombre_producto', 'cantidad', 'precio_unitario', 'subtotal'] }];
const include = [...detalles, { model: Usuario, as: 'vendedor', attributes: ['id', 'nombre', 'rol'] }];
const nombreDocumento = v => 'VENTA-' + String(v.id).padStart(6, '0');
const respuesta = v => ({ ...v.toJSON(), numero_interno: nombreDocumento(v), advertencia: 'Documento de control interno. No válido como boleta electrónica SUNAT.' });

router.get('/', asyncRoute(async (req, res) => {
  const ventas = await Venta.findAll({ include, order: [['id', 'DESC']], limit: 300 });
  res.json(ventas.map(respuesta));
}));
router.get('/:id', asyncRoute(async (req, res) => {
  const venta = await Venta.findByPk(req.params.id, { include });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  res.json(respuesta(venta));
}));

// Los importes y el stock nunca dependen del JSON del cliente.
router.post('/', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const items = body.items;
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    return res.status(400).json({ error: 'Agrega entre 1 y 50 productos.' });
  }
  const cantidades = new Map();
  for (const item of items) {
    const id = Number(item.producto_id);
    const cantidad = Number(item.cantidad);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 100000) {
      return res.status(400).json({ error: 'Producto o cantidad inválida.' });
    }
    cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
  }
  const metodo = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Otro'].includes(body.metodo_pago) ? body.metodo_pago : 'Efectivo';
  const cliente = typeof body.cliente_nombre === 'string' && body.cliente_nombre.trim()
    ? body.cliente_nombre.trim() : 'Cliente general';
  const documento = typeof body.cliente_documento === 'string' ? body.cliente_documento.trim() : '';
  if (cliente.length > 150 || documento.length > 20) {
    return res.status(400).json({ error: 'Datos del cliente demasiado largos.' });
  }

  const idVenta = await sequelize.transaction(async t => {
    let totalCentimos = 0;
    const lineas = [];
    for (const [id, cantidad] of [...cantidades.entries()].sort((a, b) => a[0] - b[0])) {
      const producto = await Producto.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!producto) throw fallo('No existe uno de los productos.', 404);
      if (Number(producto.stock) < cantidad) throw fallo('Stock insuficiente para: ' + producto.nombre, 409);
      const precio = Number(producto.precio);
      const centimos = Math.round(precio * 100);
      if (!Number.isSafeInteger(centimos) || centimos < 0) throw fallo('Precio inválido del producto.', 409);
      const subtotal = centimos * cantidad;
      if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(totalCentimos + subtotal)) throw fallo('Importe fuera de rango.');
      totalCentimos += subtotal;
      lineas.push({ producto, cantidad, centimos, subtotal });
    }
    const venta = await Venta.create({
      cliente_nombre: cliente, cliente_documento: documento || null,
      metodo_pago: metodo, total: (totalCentimos / 100).toFixed(2),
      vendedor_id: req.usuario.id
    }, { transaction: t });
    for (const linea of lineas) {
      await DetalleVenta.create({
        venta_id: venta.id, producto_id: linea.producto.id,
        nombre_producto: linea.producto.nombre, cantidad: linea.cantidad,
        precio_unitario: (linea.centimos / 100).toFixed(2),
        subtotal: (linea.subtotal / 100).toFixed(2)
      }, { transaction: t });
      const antes = Number(linea.producto.stock);
      await linea.producto.update({ stock: antes - linea.cantidad }, { transaction: t });
      await Movimiento.create({
        producto_id: linea.producto.id, usuario_id: req.usuario.id,
        tipo_movimiento: 'Salida', cantidad: linea.cantidad,
        observaciones: 'Venta interna ' + nombreDocumento(venta),
        stock_anterior: antes, stock_nuevo: antes - linea.cantidad
      }, { transaction: t });
    }
    return venta.id;
  });
  const creada = await Venta.findByPk(idVenta, { include });
  res.status(201).json(respuesta(creada));
}));

// Una venta registrada no se elimina. La anulación deja trazabilidad y repone stock.
// Se limita al administrador y no envía ninguna baja o nota de crédito a SUNAT.
router.post('/:id/anular', asyncRoute(async (req, res) => {
  if (req.usuario.rol !== 'Administrador') return res.status(403).json({ error: 'Solo el administrador puede anular ventas.' });
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : '';
  if (motivo.length < 5 || motivo.length > 250) return res.status(400).json({ error: 'Indica un motivo de 5 a 250 caracteres.' });
  const ventaId = Number(req.params.id);
  if (!Number.isSafeInteger(ventaId) || ventaId < 1) return res.status(400).json({ error: 'ID inválido.' });
  await sequelize.transaction(async t => {
    const venta = await Venta.findByPk(ventaId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!venta) throw fallo('Venta no encontrada.', 404);
    if (venta.estado === 'Anulada') throw fallo('La venta ya está anulada.', 409);
    const lineas = await DetalleVenta.findAll({ where: { venta_id: venta.id }, transaction: t, order: [['producto_id', 'ASC']] });
    for (const linea of lineas) {
      const producto = await Producto.findByPk(linea.producto_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!producto) throw fallo('No se pudo restaurar el stock del producto.', 409);
      const antes = Number(producto.stock);
      const despues = antes + Number(linea.cantidad);
      await producto.update({ stock: despues }, { transaction: t });
      await Movimiento.create({
        producto_id: producto.id, usuario_id: req.usuario.id,
        tipo_movimiento: 'Entrada', cantidad: linea.cantidad,
        observaciones: 'Anulación ' + nombreDocumento(venta) + ': ' + motivo,
        stock_anterior: antes, stock_nuevo: despues
      }, { transaction: t });
    }
    await venta.update({ estado: 'Anulada', motivo_anulacion: motivo, anulada_en: new Date() }, { transaction: t });
  });
  const venta = await Venta.findByPk(ventaId, { include });
  res.json(respuesta(venta));
}));

router.use((error, req, res, next) => {
  if (error.status) return res.status(error.status).json({ error: error.message });
  next(error);
});
module.exports = router;
