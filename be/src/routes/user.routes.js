import express from 'express';
import auth from '../middleware/auth.js';
import * as c from '../controllers/user.controller.js';

const r = express.Router();

r.post('/register', c.register);
r.post('/login', c.login);
r.get('/dashboard', auth, c.dashboard);
r.get('/sampah', auth, c.getJenisSampah);
r.post('/transaksi', auth, c.tambahTransaksi);
r.post('/tarik', auth, c.tarikSaldo);

export default r;
