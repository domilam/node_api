const express = require('express');
const feedCtrl = require('../controllers/feedCtrl');

const router = express.Router();

// GET /feed/posts
router.get('/posts', feedCtrl.getPosts);

router.post('/post', feedCtrl.createPost);

router.post('/user/create', feedCtrl.createUser);

module.exports = router;