const uniqid = require('uniqid');

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: {title: 'First Post', content: 'This is the first post'}
    });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    console.log(title);
    console.log(content);
    // Create post in db

    res.status(201).json({
        message: 'Post created successfully !!',
        post: {id: new Date().toISOString(), title: title, content: content}
    });
}

exports.createUser = (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;

    res.status(201).json({
        message: "user created succesfully !!",
        user: {id: uniqid(), user: username, email: email}
    });
}