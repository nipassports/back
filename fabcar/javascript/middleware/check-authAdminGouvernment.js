const jwt = require('jsonwebtoken');

const JWT_KEY = "secret-gouvernment";

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, JWT_KEY);
        req.userData = decoded;
        if (!decoded.admin){
            return res.status(401).json({
                message: 'Access denied'
            });
        }
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });

    }
};