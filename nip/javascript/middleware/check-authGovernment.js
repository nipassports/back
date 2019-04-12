const jwt = require('jsonwebtoken');

const JWT_KEY = "secret-government";

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, JWT_KEY);
        res.locals.countrycode = decoded.countrycode;
        res.locals.admin       = decoded.admin; 
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
};