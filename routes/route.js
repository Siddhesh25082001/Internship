const express =require('express');

const customerController = require('../controller/customerController');
const {auths} = require('../middleware/auth');

const router = express.Router();

router.post('/register', customerController.addCustomer);
router.post('/login', customerController.login);
router.post('/dashboard', auths, customerController.updateCustomer);
router.post('/subscription-payment', customerController.payment);

router.get('/dashboard', auths, customerController.goToDashboard);
router.get('/logout', customerController.logout);

router.get('/register', (req, res) => { res.render('register') })
router.get('/login', (req, res) => { res.render('login') })

module.exports = router;