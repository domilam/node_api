const uniqid = require('uniqid');
const { validationResult } = require('express-validator/check');
const fs = require('fs');
const path = require('path');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    try{
        const count = await Post.find().countDocuments()
        totalItems = count;
        const posts = await Post.find()
                        .populate('creator')
                        .sort({ createdAt: -1})
                        .skip((currentPage - 1) * perPage)
                        .limit(perPage);
        res.status(200);
        res.json({
            message: 'Récupération des posts OK',
            posts: posts,
            totalItems: totalItems
        });
    }
    catch (err) {
        if (!err.statusCode){
        err.statusCode = 500;
        }
        next(err);
    };
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error = new Error('Echec de la validation, les données sont incorrectes !');
        error.statusCode = 422;
        throw error;
    }

    if (!req.file){
        const error = new Error('Image non fournie !');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path.replace("\\" ,"/");
    const title = req.body.title;
    const content = req.body.content;
    console.log(title);
    console.log(content);
    // Create post in db
    const post = new Post({
        title: title,
        imageUrl: imageUrl,
        content: content,
        creator: req.userId
    });
    let userFetched;
    User.findById({_id: req.userId})
    .then(user => {
        if (!user){
            error = new Error('Utilisateur inexistant !');
            error.statusCode = 422;
            throw error;
        }
        userFetched = user;
        user.posts.push(post);
        return user.save();
    })
    .then(user => {
        return post.save() 
    })
    .then(result => {
        console.log(result);
        io.getIO().emit('posts', { action: 'create', post: {...post._doc,  creator: {_id: req.userId, name: userFetched.name}}});
        res.status(201).json({
            message: 'Post created successfully !!',
            post: result,
            user: {userId: userFetched._id, name: userFetched.name}
        });
    })
    .catch(err=>{
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });

}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if (!post){
            const error = new Error('Pas de post !!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'Post trouvé',
            post: post
        });
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}
exports.createUser = (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;

    res.status(201).json({
        message: "user created succesfully !!",
        user: {id: uniqid(), user: username, email: email}
    });
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error = new Error('Echec de la validation, les données sont incorrectes !');
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file){
        imageUrl = req.file.path.replace("\\" ,"/");
    }
    if (!imageUrl){
        const error = new Error("pas d'images séléectionées !");
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId).populate('creator')
    .then(post => {
        if (!post){
            const error = new Error('Pas de post');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId){
            const error = new Error("Opération non autorisée !!");
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl != post.imageUrl){
            deleteImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save();
    })
    .then(result=>{

        io.getIO().emit('posts', { action: 'update', post: result });
        res.status(200).json({message: 'Post modifié', post: result});
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
        
    })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if (!post){
            const error = new Error('Pas de post');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId){
            const error = new Error("Opération non autorisée !!");
            error.statusCode = 403;
            throw error;
        }

        // verifier le user connecté
        deleteImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    })
    .then(post=>{
        return User.findById(req.userId)
    })
    .then( user =>{
        console.log(user.posts);
        let index = user.posts.indexOf(postId);
        console.log(index);
        if (!(index > -1)){
            const error = new Error('Post non trouvé pour ce user !!');
            error.statusCode = 500;
            throw error;
        }
        // user.posts.splice(index,1);
        user.posts.pull(postId);
        return user.save();
    })
    .then( result => {
        io.getIO().emit('posts', { action: 'delete', post: postId });
        res.status(200).json({message: 'Post supprimé'});
    })
    .catch(err => {
        if (!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
        
    });
}
const deleteImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};