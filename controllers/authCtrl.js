const User = require('../models/user');
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error = new Error('La validation a échoué !!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    bcrypt.hash(password, 12)
    .then(hashPassword => {
        const user = new User({
            email: email,
            password: hashPassword,
            name: name
        });
        return user.save();
    })
    .then(result => {
        res.status(201).json({ message: 'Utilisateur créé !', userId: result._id});
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });



}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                const error = new Error('Utilisateur inexistant');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual){
                const error = new Error("Le mot de passe n'est pas valide");
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: loadedUser.email, 
                userId: loadedUser._id.toString()
            }, 'V8IjhaMpSwhkdOmvc2Qr7MjSAjME1DAV', { expiresIn: '1h'}); // secret key don't push it

            res.status(200).json({ token: token, userId: loadedUser._id.toString() });
        })
        .catch(err => {
            if (!err.statusCode){
                err.statusCode = 500;
            }
            next(err);

        })
}