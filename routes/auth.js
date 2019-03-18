const express = require('express');
const { check } = require('express-validator/check');
const User = require('../models/user');
const authCtrl = require('../controllers/authCtrl');


const router = express.Router();

router.put('/signup', [
    check('email')
        .isEmail()
        .withMessage('Merci de saisir un email correcte !!')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Cette adresse email existe déjà !!!');
                    }
                });
        })
        .normalizeEmail(),
    check('password').trim().isLength({ min: 5 }),
    check('name').trim().not().isEmpty()
], authCtrl.signup);

router.post('/login', authCtrl.login);

module.exports = router;