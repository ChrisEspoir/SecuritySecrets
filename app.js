const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();
const port = 3000

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({email: String, password: String});
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
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save()
        .then(() => {
            console.log('Saved successfully to userDB');
            res.render('secrets');
        })
        .catch((err) => {console.error(`Error found while savind to userDB: ${err}`);})
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username})
        .then((foundUser) => {
            if (foundUser.password === password) {
                console.log(`Successfully found: ${foundUser.password} and now rendering secrets`);
                res.render('secrets');
            };
        })
        .catch((err) => {console.error(`Error found: ${err}`);})
})
















app.listen(port, (req, res) => {
    console.log(`Server started on port ${port}`);
})