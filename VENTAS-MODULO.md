# Módulo comercial: ventas y comprobantes internos

Extensión del inventario existente. Se mantienen los productos, categorías, proveedores, usuarios, JWT y movimientos Kardex.

## Alcance
- `GET /api/ventas` y `GET /api/ventas/:id`: ventas y detalles (JWT).
- `POST /api/ventas`: registrar venta con varios productos, cálculos del lado del backend y descuento de stock dentro de una **transacción MySQL**. Se crean movimientos Kardex de salida.
- `POST /api/ventas/:id/anular`: **Administrador** únicamente, exige motivo, conserva la venta con estado Anulada, devuelve stock y registra movimientos de entrada.
- No existe endpoint DELETE de ventas. Esto evita perder trazabilidad o duplicar numeraciones internas.
- La venta devuelve número interno `VENTA-000001`, no serie fiscal ni CDR de SUNAT.

## Actualizar la PC

1. **Respaldar APIDB**: HeidiSQL → exportar base de datos como SQL, incluir estructura y datos.
2. Detener el backend y el frontend con `Ctrl + C` en cada terminal.
3. Revisar `git status` en ambos repositorios y conservar cualquier cambio local. Si solo cambió `package-lock.json` por npm install, puedes usar `git stash push -m "Cambios locales previos a ventas"` antes de actualizar.
4. En cada carpeta y sobre la rama `feature/laboratorio-10-seguridad` ejecutar `git pull --ff-only origin feature/laboratorio-10-seguridad` y `npm.cmd install`.
5. En miApi ejecutar `npm.cmd run dev`; `sequelize.sync({ force: false })` creará `ventas` y `detalle_ventas` sin borrar tablas existentes. Verificar ambas tablas en HeidiSQL.
6. En appInventario ejecutar `npm.cmd run dev`, abrir `http://localhost:5173` y entrar con tu administrador.

## Prueba de venta

- Registrar un producto con stock suficiente y recordar las unidades iniciales.
- Entrar a Nueva venta, agregar productos, elegir cantidades, cliente y pago, confirmar.
- Verificar la venta y el comprobante, imprimirlo o guardarlo como PDF desde el navegador.
- Comprobar en Productos el stock reducido y en Kardex las salidas.
- Entrar en Historial de ventas y abrir el detalle.
- Con una cuenta Administrador, seleccionar Anular, introducir motivo y confirmar.
- Verificar el estado Anulada, el stock restaurado y el Kardex de entradas. Intentar una segunda anulación: debe dar 409.
- No anular comprobantes fiscales de SUNAT usando esta función; solo anula la operación del inventario interno.

## Importante: boleta electrónica peruana

Este módulo **NO emite comprobantes de pago electrónicos válidos**. No genera XML UBL, firma digital, ni envía comprobantes/resúmenes a SUNAT/OSE. Para emitir boletas reales se requiere integrar un sistema de emisión autorizado y sus procedimientos de corrección o baja (p. ej. nota de crédito según el caso). El comprobante imprimible se identifica explícitamente como interno.
