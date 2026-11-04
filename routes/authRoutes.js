const { Router } = require('express');
const { registrar, login, perfil } = require('../controllers/authController');
const autenticar = require('../middleware/authMiddleware');

const router = Router();
router.post('/register', registrar);
router.post('/login', login);
router.get('/me', autenticar(), perfil);

module.exports = router;
