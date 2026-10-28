const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/db');
const registrarRutas = require('./routes');

const app = express();
app.use(cors()); // Uso académico local: limitar los orígenes antes de desplegar.
app.use(express.json());

app.get('/', (req, res) => res.send('API de inventario funcionando'));
registrarRutas(app);

const PORT = process.env.PORT || 3006;
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log('Servidor corriendo en http://localhost:' + PORT));
  console.log('Base de datos conectada y sincronizada.');
}).catch(error => {
  console.error('Error al conectar o sincronizar MySQL:', error);
  console.error('Si vienes del Lab #8, primero ejecuta npm run migrate.');
});
