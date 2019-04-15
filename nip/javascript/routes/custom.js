// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const checkAuth = require('../middleware/check-authCustom.js');

const JWT_KEY = "secret-custom";

const smartContract = require('../smartContract.js');
const promisePassport = smartContract(2, 'passport');
const promiseVisa = smartContract(2, 'visa');

var hash = require('object-hash');

const CustomUser = require('../models/customUser');

//Authentifiction
router.post("/auth", (req, res, next) => {
  CustomUser.find({
      identifiant: req.body.identifiant
    })
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
          const token = jwt.sign({
              identifiant: customUser[0].identifiant,
              password: customUser[0].password
            },
            JWT_KEY, {
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


////////////// Passeports //////////////

//Récupérer tous les passeports
router.get('/passport', checkAuth, (req, res, next) => {
  promisePassport.then((contract) => {
    return contract.evaluateTransaction('queryAllPassports');
  }).then((buffer) => {
    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Récupérer le passeport d'un citoyen
router.get('/passport/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  promisePassport.then((contract) => {
    return contract.evaluateTransaction('queryPassportsByPassNb', passNb);
  }).then((buffer) => {
    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Recherche de passeports
router.post('/passport/search', checkAuth, (req, res, next) => {
  var info = {
    autority: req.body.autority,
    countryCode: req.body.countryCode,
    dateOfExpiry: req.body.dateOfExpiry,
    dateOfBirth: req.body.dateOfBirth,
    dateOfIssue: req.body.dateOfIssue,
    eyesColor: req.body.eyesColor,
    height: req.body.height,
    name: req.body.name,
    nationality: req.body.nationality,
    passNb: req.body.passNb,
    passOrigin: req.body.passOrigin,
    placeOfBirth: req.body.placeOfBirth,
    residence: req.body.residence,
    sex: req.body.sex,
    surname: req.body.surname,
    type: req.body.type,
    validity: req.body.validity
  };
  keys = ['autority', 'countryCode', 'dateOfExpiry', 'dateOfBirth', 'dateOfIssue', 'eyesColor', 'height', 'name', 'nationality', 'passNb', 'passOrigin', 'placeOfBirth', 'residence', 'sex', 'surname', 'type', 'validity'];
  promisePassport.then((contract) => {
    return contract.evaluateTransaction('queryAllPassports'); //On récupère les passeports d'un pays
  }).then((buffer) => {
    var passports = JSON.parse(buffer.toString());
    keys.forEach(function (key) {
      if (info[key] !== undefined) {
        for (var ii = 0; ii < passports.length; ii++) {
          console.log(passports[ii].infos[key]);
          if (passports[ii].infos[key] !== info[key]) {
            delete passports[ii];
          }
        }
      }
    });
    var anwser = passports.filter(function (val) {
      return val !== ''
    });
    res.status(200).json(anwser);
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });

});

////////////// Visa //////////////

//Récupérer tous les Visas
router.get('/visa', checkAuth, (req, res, next) => {
  promiseVisa.then((contract) => {
    return contract.evaluateTransaction('queryAllVisas');
  }).then((buffer) => {
    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Récupérer les visas d'un citoyen
router.get('/visa/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  promiseVisa.then((contract) => {
    return contract.evaluateTransaction('queryVisasByPassNb', passNb);
  }).then((buffer) => {
    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});


module.exports = router;