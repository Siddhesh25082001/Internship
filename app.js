// Required Dependencies
require('dotenv').config

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

// MongoDB Connection String
const connection_string = 'mongodb+srv://aryan:aryan123@cluster0.kvntc.mongodb.net/yoga?retryWrites=true&w=majority'

// Connecting to MongoDB
mongoose.connect(connection_string, { useNewUrlParser:true, useUnifiedTopology:true})
    .then( () => console.log("Connected to Atlas Database Successfully !!!"))
    .catch( (err) => console.log("Error : ", err));

// Creating express app
const app = express();

// Setting the view engine to ejs
app.set('view engine', 'ejs');

// Setting the path to static files
app.use(express.static('static'));

// Use case dependencies
app.use(express.json());
app.use(cookieParser('SecretStringForCookies'))
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'yoga-app',
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true
}))
app.use(flash());

// Global variables - Store success and error messages 
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    res.locals.warn = req.flash('warn');
    next();
});

// Landing route
app.get('/', (req,res) => {
    res.send('Landing Page');
});

app.get('/api/success', (req, res) => {
    res.render('register', {
        message: 'Payment Successful'
    })
})

app.get('/api/failure', (req, res) => {
    res.render('register', {
        message: 'Payment Unsuccessful'
    })
})

// Base Api
app.use('/api', require('./routes/route'));

app.get('*', (req,res) => {
    res.redirect('/')
})

// Port
const port = 3000

// Listening to the port
app.listen(process.env.PORT || port, (req, res) => {
    console.log(`Listening On port ${port}`);
});