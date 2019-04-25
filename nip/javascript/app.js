// eslint-disable-next-line strict
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');
const mongoose  = require('mongoose');

const smartContract = require('./smartContract.js');
const promisePassport = smartContract(3,'passport');

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

const requestLoop = setInterval(function(){
    promisePassport.then( (contract) =>{
        return contract.evaluateTransaction('queryAllPassports');
    }).then((buffer)=>{
        let passports = JSON.parse(buffer.toString());
        passports.forEach(passport => {
            let sdate=passport.infos.dateOfExpiry;
            let date1= new Date();
            let today= new Date();
            date1.setFullYear(sdate.substr(6,4));
            date1.setMonth(sdate.substr(3,2));
            date1.setDate(sdate.substr(0,2));
            date1.setHours(0);
            date1.setMinutes(0);
            date1.setSeconds(0);
            date1.setMilliseconds(0);
            let d1=date1.getTime();
            if(d1< today.getTime()){
                promisePassport.then( (contract) =>{
                    return contract.submitTransaction('changePassportValidity', passport.infos.passNb);
                }).then((buffer) => {
                    console.log("Validity changed");
                });
            }else{
                console.log("no changes");
            }
        });
            
        });

    
}, 86400000);


module.exports = app;
