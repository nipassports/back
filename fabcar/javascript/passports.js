// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const checkAuth = require('./check-auth');

const JWT_KEY = "secret";

const smartContract = require('./smartContract.js');
const promise = smartContract();

var randomstring = require("randomstring");
var hash = require('object-hash');

router.get('/' ,  (req, res, next)=>{
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
router.post('/authcitizen', (req, res, next) => {
    const passNb = req.body.passNb;
    const pwd = req.body.password;
    
    promise.then( (contract) => {
        const salt = "NIPs";
        return contract.evaluateTransaction('validNumPwd',passNb, hash(pwd.concat(salt)) );
    }).then((buffer)=>{
        if (buffer) {
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

router.post('/', (req, res, next)=>{
    const autority = req.body.autority;
    const countryCode = req.body.countryCode;
    const dateOfExpiry = req.body.dateOfExpiry;
    const dateOfBirth = req.body.dateOfBirth;
    const dateOfIssue = req.body.dateOfIssue;
    const eyesColor = req.body.eyesColor;
    const height = req.body.height;
    const name = req.body.name;
    const nationality = req.body.nationality;
    const passNb = req.body.passNb;
    const passOrigin = req.body.passOrigin;
    const placeOfBirth = req.body.placeOfBirth;
    const residence = req.body.residence;
    const sex = req.body.sex;
    const surname = req.body.surname;
    const type = req.body.type;
    const validity = req.body.validity;
    const image = "req.body.image";
    console.log('Ajout d\' un passeport');

    var password = randomstring.generate(12);
    const salt = "NIPs";
    console.log('Ajout d\' un passeport');


    promise.then( (contract) =>{
        return contract.submitTransaction('createPassport', type , countryCode , passNb , name , surname , dateOfBirth , nationality , sex , placeOfBirth , height , autority , residence , eyesColor , dateOfExpiry , dateOfIssue , passOrigin , validity, hash(password.concat(salt)), image );
    }).then((buffer)=>{
        res.status(200).json({
            message: 'Transaction has been submitted',
            password: password
        });
    }).catch((error)=>{
        res.status(200).json({
            error: error
        });
    });
});

router.get('/:passNb' , checkAuth , (req, res, next)=> {
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

router.post('/update/' , (req, res, next)=>{
    const passportId = req.body.passportId;
    const newOwner = req.body.newOwner;
    console.log('hello');

    promise.then( (contract) =>{
        return contract.submitTransaction('changePassportOwner', passportId , newOwner);
    }).then((buffer)=>{
        res.status(200).json({
            message: 'Transaction has been submitted'
        });
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});


module.exports = router;
