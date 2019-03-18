const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader){
        const error = new Error('Utilisateur non authentifié !!');
        error.statusCode = 401;
        throw error;
    } 
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'V8IjhaMpSwhkdOmvc2Qr7MjSAjME1DAV');
    }
    catch (err){
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken){
        const error = new Error('Utilisateur non autorisé');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
}