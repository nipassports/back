// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const checkAuth = require('../middleware/check-authGouvernment');

const JWT_KEY = "secret-gouvernment";

const smartContract = require('../smartContract.js');
const promise = smartContract();

var randomItem = require('random-item');
var randomstring = require("randomstring");
var hash = require('object-hash');
const GouvernmentUser = require('../models/gouvernmentUser');


router.post("/auth",(req, res, next) => {
    GouvernmentUser.find({ identifiant: req.body.identifiant })
      .exec()
      .then(gouvernmentUser => {
        if (gouvernmentUser.length < 1) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        bcrypt.compare(req.body.password, gouvernmentUser[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Auth failed"
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                identifiant: gouvernmentUser[0].identifiant,
                password: gouvernmentUser[0].password
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


router.get('/all:countryCode' ,checkAuth, (req, res, next)=>{
    const countryCode = req.params.countryCode;
    promise.then( (contract) =>{
        return contract.evaluateTransaction('searchPassport',countryCode);
    }).then((buffer)=>{
      
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});

router.post('/random',(req, res, next)=>{
    const autority = String(randomItem(["Préfecture de ","Town hall of"]));
    const countryCode = String(randomItem(["FR", "DE", "UK", "US", "JP", "BR"]));
    const dateOfExpiry = String(randomItem(["06/02/2020","13/01/2020","31/08/2022","25/10/2019","01/01/2024"]));
    const dateOfBirth = String(randomItem(["03/03/1995","13/01/1997","08/12/1956","25/12/2001","12/06/1983"]));
    const dateOfIssue = String(randomItem(["06/02/2010","13/01/2010","31/08/2012","25/10/2009","01/01/2014"]));
    const eyesColor = String(randomItem(["blue", "brown", "green", "gray", "black"]));
    const height = String(randomItem(["1.45","1.57","1.98","1.77","1.62","1.85","1.59"]));
    const name = String(randomItem(["Carla","John","Mathieu","Julie","Anne","Jean-Baptiste","Alexandre"]));
    const nationality = String(randomItem(["French","German","British","American","Japanese","Brazilian"]));
    const passNb = randomstring.generate(8);
    const passOrigin = String(randomItem(["France","Germany","United Kingdom","United States","Japan","Brazil"]));
    const placeOfBirth = String(randomItem(["France","Germany","United Kingdom","United States","Japan","Brazil"]));
    const residence = String(randomItem(["Avenue des Facultés, 33400 Talence","600-8216, Kyōto-fu, Kyōto-shi, Shimogyō-ku, Higashi-Shiokōji 721-1","455 Larkspur Dr. California Springs, CA 92926"]));
    const sex = String(randomItem(["M","F","NB"]));
    const surname = String(randomItem(["Smith","Legrand","Brown", "Bach","Williams","Bernard","Adamovitch"]));
    const type = String(randomItem(["P","D"]));
    const validity = String(randomItem(["Y","N"]));
    const image = "req.body.image";

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


router.post('/', checkAuth, (req, res, next)=>{

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


router.get('/one:passNb' ,checkAuth, (req, res, next)=> {
    const passNb = req.params.passNb;
    promise.then( (contract) =>{
        return contract.evaluateTransaction('queryPassportsByPassNb',passNb);
    }).then((buffer)=>{
      console.log("ok\n");
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});

router.post('/update/' ,checkAuth, (req, res, next)=>{
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
