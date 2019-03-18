const express = require('express');
const feedCtrl = require('../controllers/feedCtrl');
const isAuth = require('../middleware/is-auth');


const {check} = require('express-validator/check');
const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedCtrl.getPosts);

router.post('/post', isAuth, [check('title')
                    .trim()
                    .isLength({min: 5, max:15}),
                    check('content')
                    .trim()
                    .isLength({min: 5, max:256})
                    ],  feedCtrl.createPost);

router.get('/post/:postId', isAuth, feedCtrl.getPost);

router.put('/post/:postId', isAuth, [check('title')
                    .trim()
                    .isLength({min: 5, max:15}),
                    check('content')
                    .trim()
                    .isLength({min: 5, max:256})
                    ], feedCtrl.updatePost);

router.delete('/post/:postId', isAuth, feedCtrl.deletePost);                    
router.post('/user/create', isAuth, feedCtrl.createUser);

module.exports = router;