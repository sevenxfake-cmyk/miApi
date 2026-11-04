const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sequelize = require('./config/db');
const registrarRutas = require('./routes');
const authRoutes = require('./routes/authRoutes');
const autenticar = require('./middleware/authMiddleware');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configura JWT_SECRET con al menos 32 caracteres aleatorios en .env.');
}
const app = express();
app.disable('x-powered-by');
app.use(helmet());
const origenesPermitidos = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: origenesPermitidos,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb' }));

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
});
const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Intenta más tarde.' }
});
app.get('/', (req, res) => res.send('API de inventario funcionando'));
app.use('/api', limitador);
app.use('/api/auth', limitadorAuth, authRoutes);

// El inventario existente queda protegido en /api/ y en sus rutas
// históricas sin prefijo para no romper clientes antiguos.
const inventario = express.Router();
registrarRutas(inventario);
app.use('/api', autenticar(), inventario);
app.use('/', autenticar(), inventario);

const PORT = Number(process.env.PORT || 3006);
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log('Servidor corriendo en http://localhost:' + PORT));
  console.log('Base de datos conectada y sincronizada.');
}).catch(error => {
  console.error('Error al conectar o sincronizar MySQL:', error);
  console.error('Si vienes del Lab #8, primero ejecuta npm run migrate.');
});
