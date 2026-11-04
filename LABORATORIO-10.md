# Laboratorio #10 — Seguridad y autenticación (SENATI)

Esta rama incorpora JWT, bcrypt, Helmet, CORS y límites por IP al backend de inventario del Laboratorio #9. **No borra tablas ni registros**: se mantiene `sequelize.sync({ force: false })`. Hacer respaldo de APIDB antes de ejecutar migraciones.

## 1. Preparar la PC

1. Iniciar MySQL (XAMPP o servicio local) y abrir HeidiSQL.
2. Copiar `.env.example` como `.env` (si ya existe, conservar credenciales de MySQL).
3. Generar `JWT_SECRET` localmente:
   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```
   Pegar la salida en `.env` como `JWT_SECRET=...` (nunca compartirla).
4. En la carpeta miApi ejecutar:
   ```powershell
   npm install
   npm run migrate
   npm run dev
   ```
   `npm install` actualiza también el package-lock con las nuevas dependencias.
5. Si no existe un administrador, completar `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` en `.env` y ejecutar `npm run seed:admin` una sola vez. Reiniciar el servidor si se modificó `.env`.

La API escucha en `http://localhost:3006`. El frontend debe usar la rama `feature/laboratorio-10-seguridad` del repositorio appInventario y ejecutarse en `http://localhost:5173`.

## 2. Endpoints de autenticación

- `POST /api/auth/register`: registro público de usuarios **Almacenero** (ignora roles enviados en el cuerpo).
- `POST /api/auth/login`: devuelve `token` y `usuario`.
- `GET /api/auth/me`: devuelve usuario actual, requiere `Authorization: Bearer TOKEN`.
- `/api/productos`, `/api/categorias`, `/api/proveedores`, `/api/movimientos`, `/api/dashboard/resumen` y `/api/usuarios`: requieren JWT. También se protegen las rutas antiguas sin `/api` para no dejar accesos públicos alternativos.

Ejemplo para registrar usuario de pruebas:

```json
{"nombre":"Estudiante Prueba","email":"estudiante@example.com","password":"ClaveSegura2026"}
```

Para login:

```json
{"email":"estudiante@example.com","password":"ClaveSegura2026"}
```

**Nunca usar esas contraseñas de ejemplo en un sistema real.**

## 3. Compatibilidad con base anterior

El script `seed:admin` anterior guardaba hashes con prefijo `scrypt:`. El login los verifica y, si la contraseña es correcta, reemplaza el hash por bcrypt. Los nuevos registros usan bcrypt desde el inicio. No se restablecen contraseñas ni se elimina historial.

El responsable de un movimiento Kardex se obtiene del JWT comprobado por la API. Ya no se puede suplantar el `usuario_id` mediante el cuerpo de la petición.

## 4. Capturas para entregar

- Terminal con servidor backend y frontend ejecutándose sin errores.
- HeidiSQL: tablas `usuarios`, `productos` y `movimientos`, con contraseña almacenada como hash (ocultar datos sensibles).
- Postman: registro 201, login 200 y token JWT (ocultar parte del token en capturas).
- Postman: GET /api/productos sin token 401 y con Bearer 200.
- Postman: POST y PUT /api/productos con autorización; DELETE requiere el token del **Administrador** (eliminar solamente productos sin Kardex).
- Verificación RBAC: un usuario Almacenero recibe 403 si intenta DELETE.
- Navegador React: login, crear, editar y eliminar un producto y registrar movimiento.
- Evidencia adicional: token inválido 401 y control de acceso.

## 5. Notas

- `CORS_ORIGINS` acepta URLs de frontend separadas por coma. CORS restringe navegadores; **no reemplaza JWT**.
- Esta rama conserva una demo local del navegador en Vercel cuando no se configura backend HTTPS. La demo no demuestra seguridad de MySQL ni JWT.
- No se han hecho pruebas de ejecución sobre la PC del alumno ni una integración con su instancia de MySQL. Se requieren las pruebas anteriores.
