require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 3000

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String, 
    password: String
});

const User = new mongoose.model('User', userSchema);


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds)
        .then((hash) => {

            const newUser = new User({
                email: req.body.username,
                password: hash
            });
            newUser.save()
                .then(() => {
                    console.log('Saved successfully to userDB');
                    res.render('secrets');
                })
                .catch((err) => {console.error(`Error found while savind to userDB: ${err}`);})
        })
        .catch((err) => {console.error(`Error while Bcrypting: ${err}`);})

    
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username})
        .then((foundUser) => {
            bcrypt.compare(password, foundUser.password)
                .then((result) => {
                    if (result === true) {
                        console.log(`Successfully found and now rendering secrets`);
                        res.render('secrets');
                    }else {
                        res.render('login-fail')
                    }
                    
                })
          
        })
        .catch((err) => {console.error(`Error found: ${err}`);})
})
















app.listen(port, (req, res) => {
    console.log(`Server started on port ${port}`);
})