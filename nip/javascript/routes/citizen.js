// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const checkAuthCitizen = require('../middleware/check-auth.js');

const JWT_KEY = "secret";

const smartContract = require('../smartContract.js');
const promisePassport = smartContract(1,'passport');
const promiseVisa = smartContract(1,'visa');

var hash = require('object-hash');

router.post('/auth', (req, res, next) => {
    const passNb = req.body.passNb;
    const pwd = req.body.password;
    
    promisePassport.then( (contract) => {
        const salt = "NIPs";
        console.log(hash(pwd.concat(salt)));
        return contract.evaluateTransaction('validNumPwd',passNb, hash(pwd.concat(salt)) );
    }).then((buffer)=>{
        if (buffer.toString() === "true") {
            const token = jwt.sign(
              {
                passNb: req.body.passNb,
                password: pwd
              },
              JWT_KEY,
              {
                  expiresIn: "5min"
              }
            );
            res.status(200).json({
              message: "Auth successful",
              token: token
            });
        }else{
            res.status(401).json({
                message: "Auth failed"
            });
        }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


router.get('/passport', checkAuthCitizen , (req, res, next)=> {
    const passNb = res.locals.passNb;
    promisePassport.then( (contract) =>{
        return contract.evaluateTransaction('queryPassportsByPassNb',passNb);
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});

router.get('/visa', checkAuthCitizen , (req, res, next)=> {
    const passNb = res.locals.passNb;
    promiseVisa.then( (contract) =>{
        return contract.evaluateTransaction('queryVisasByPassNb',passNb);
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});


module.exports = router;
