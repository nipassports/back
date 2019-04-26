// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const moment = require('moment');
const mongoose = require("mongoose");
const checkAuthCitizen = require('../middleware/check-auth.js');

const JWT_KEY = "secret";

const smartContract = require('../smartContract.js');
const promisePassport = smartContract(1,'passport');
const promiseVisa = smartContract(1,'visa');
const Problem = require('../models/problem');

var hash = require('object-hash');

//Authentification
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

//ajout d'un problème
router.post('/problem',checkAuthCitizen ,(req, res, next) => {
   //get the country code of this passport
   promisePassport.then( (contract) =>{
       const passNb = res.locals.passNb;
    return contract.evaluateTransaction('queryPassportsByPassNb',passNb);
}).then((buffer)=>{
     const problem=new Problem({
        _id: new mongoose.Types.ObjectId(), 
        passNb : res.locals.passNb,
        message : req.body.message,
        countryCode : JSON.parse(buffer.toString()).infos.countryCode,
        type : req.body.type,
        date : moment().format('DD/MM/YYYY at HH:mm'),
        email : req.body.email,
        title : req.body.title,
        author : 0,
        status : "new"
        });
        problem
        .save()
        .then(result => {
            console.log(result);
            res.status(201).json({
              message: "Problem sent"
            });
          })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            error: err
          });
        })}).catch((error)=>{
            res.status(200).json({
                error
            });
        });
        ;  
});
// récupérer les problemes
router.get('/problems', checkAuthCitizen, (req, res, next) => {
    const passNb = res.locals.passNb;
    Problem.find({passNb:passNb}).sort({ date : -1 }).limit(10)
      .then(problem => (problem) ? res.status(201).json(problem) : res.status(250).json({ message: "no problems declared " }))
      .catch(err => console.log("err" + err))
  })

//Récupérer le passeport
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

//Récupérer les Visas
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
