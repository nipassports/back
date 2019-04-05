// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const checkAuth = require('../middleware/check-authCustom.js');

const JWT_KEY = "secret-custom";

const smartContract = require('../smartContract.js');
const promise = smartContract(2);

var hash = require('object-hash');

const CustomUser = require('../models/customUser');

router.post("/auth", (req, res, next) => {
    CustomUser.find({ identifiant: req.body.identifiant })
      .exec()
      .then(customUser => {
        if (customUser.length < 1) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        bcrypt.compare(req.body.password, customUser[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Auth failed"
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                identifiant: customUser[0].identifiant,
                password: customUser[0].password
              },
              JWT_KEY,
              {
                  expiresIn: "5min"
              }
            );
            return res.status(200).json({
              message: "Auth successful",
              token: token
            });
          }
          res.status(401).json({
            message: "Auth failed"
          });
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });


router.get('/' ,checkAuth,  (req, res, next)=>{
    promise.then( (contract) =>{
        return contract.evaluateTransaction('queryAllPassports');
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});


router.get('/:passNb',checkAuth, (req, res, next)=> {
    const passNb = req.params.passNb;
    promise.then( (contract) =>{
        return contract.evaluateTransaction('queryPassportsByPassNb',passNb);
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});

module.exports = router;
