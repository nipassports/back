// eslint-disable-next-line strict
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');
const mongoose  = require('mongoose');

mongoose.connect('mongodb+srv://ozemzami:7ZuoZkVIJcYjpb2l@nips-q4sgv.mongodb.net/test?retryWrites=true', { useNewUrlParser: true })

const citizenRoute = require('./routes/citizen');
const governmentRoute = require('./routes/government');
const customRoute = require('./routes/custom');
const adminRoute = require('./routes/admin');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '50mB'}));

app.use((req, res, next) => {
    res.header('Access-control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use('/citizen' , citizenRoute);
app.use('/government' , governmentRoute);
app.use('/custom' , customRoute);
app.use('/admin' , adminRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status= 404;
    next(error);
});

app.use((error, req, res, next) =>{
    res.status(error.status || 500);
    res.json({
        error: {
            message : error.message
        }
    });
});


module.exports = app;
