# Ampliación del inventario relacional - SENATI

## Importante: respaldo y migración
Este cambio amplía el esquema del Laboratorio #8. Antes de ejecutarlo, exporta una copia de APIDB desde HeidiSQL. Trabaja con la rama feature/inventario-relacional en ambos repositorios.

1. Conserva las credenciales locales de miApi/.env.
2. Backend: npm install
3. Ejecuta una vez: npm run migrate. Crea categorias, proveedores, usuarios, movimientos y agrega categoria_id y proveedor_id a Productos si faltan. Los productos anteriores se asignan a la categoría General; no se borran.
4. Añade a tu .env solo localmente ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD (mínimo 8 caracteres).
5. Ejecuta npm run seed:admin para crear un responsable. Password almacenado como hash scrypt.
6. Ejecuta npm run dev en miApi (puerto 3006).
7. En el frontend selecciona la misma rama y ejecuta npm install y npm run dev.

## Endpoints
- GET/POST/PUT/DELETE /categorias
- GET/POST/PUT/DELETE /proveedores
- GET/POST/PUT/DELETE /productos (stock NO editable directamente)
- GET /usuarios (solo ID, nombre y rol; nunca passwords)
- GET/POST /movimientos
- GET /dashboard/resumen

## Relaciones
- Categorias 1:N Productos. Categoria obligatoria en la API y en el formulario.
- Proveedores 1:N Productos (proveedor opcional).
- Productos 1:N Movimientos.
- Usuarios 1:N Movimientos.

## Kardex
POST /movimientos: { "producto_id": 1, "usuario_id": 1, "tipo_movimiento": "Entrada", "cantidad": 5, "observaciones": "Compra" }.
Entrada aumenta stock; Salida resta y rechaza stock insuficiente; Ajuste usa la cantidad como stock final, incluso cero. Se utiliza una transacción y un bloqueo de fila para que la actualización de productos y el registro de movimiento sean atómicos.

## Limitaciones de esta práctica
Se incluye la tabla Usuarios y password protegido con hash, pero todavía NO hay autenticación ni autorización, tal como la guía propone investigar posteriormente. El selector de responsable en Kardex no acredita la identidad real. No desplegar públicamente sin autenticación, control de acceso y CORS restringido.

Los productos antiguos conservan su stock, pero no existe historial anterior a esta ampliación. Respaldar APIDB antes de la migración. El código no se ha ejecutado en la PC de SENATI; se deben verificar migraciones y funcionalidades allí.
