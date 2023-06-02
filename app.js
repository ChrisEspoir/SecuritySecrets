require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
/* Passport and Express-Session*/
const passport = require('passport');
const session = require('express-session');
const passportLocalMonngoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();
const port = 3000

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMonngoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user)
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {

            // console.log(profile);
            return done(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/secrets', (req, res) => {
    User.find({'secret': {$ne: null}})
        .then((foundUsers) => {
            res.render('secrets', {usersWithSecrets: foundUsers});
        })
        .catch((err) => {console.error(`Found Error in [FOUND-USERS]: ${err}`);})
});

app.get('/submit', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { console.error(err); }
    });
    res.redirect('/');
});

app.get('/auth/google',
    passport.authenticate('google', {scope: ['profile']})
);

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        successRedirect: '/secrets',
        failureRedirect: '/register'
    })
);

app.post('/register', (req, res) => {

    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            })
        }
    });

})

app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    });
});


app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret;

    User.findById(req.user._id)
    .then((foundUser) => {
        foundUser.secret = submittedSecret
        foundUser.save()
            .then(() => {
                res.redirect('/secrets')
            })
            .catch((err) => {console.error(`Error found while saving Secret: ${err}`);})
    })
    .catch((err) => {console.error(`Error found while finding ID: ${err}`);})
})





app.listen(port, (req, res) => {
    console.log(`Server started on port ${port}`);
})