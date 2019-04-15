// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

//Include pour les connexions (blockchain et mangoDB)
const smartContract = require('../smartContract.js');
const promisePassport = smartContract(3,'passport');
const promiseVisa = smartContract(3,'visa');
const GovernmentUser = require('../models/governmentUser');
const checkAuth = require('../middleware/check-authGovernment');
const JWT_KEY = "secret-government";

//Include pour le password
var randomItem = require('random-item');
var randomstring = require("randomstring");
var hash = require('object-hash');

//Authentifiction
router.post("/auth", (req, res, next) => {
  GovernmentUser.find({
      identifiant: req.body.identifiant
    })
    .exec()
    .then(governmentUser => {
      if (governmentUser.length < 1) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      bcrypt.compare(req.body.password, governmentUser[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        if (result) {

          const token = jwt.sign({
              identifiant: governmentUser[0].identifiant,
              password: governmentUser[0].password,
              countryCode : governmentUser[0].countryCode,
              admin: governmentUser[0].admin
            },
            JWT_KEY, {
              expiresIn: "5min"
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
	    countryCode: governmentUser[0].countryCode,
            admin: governmentUser[0].admin
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

//Récupérer les passeports d'un pays
router.get('/passport/all', checkAuth, (req, res, next) => {
  const countryCode = res.locals.countryCode;
  console.log(countryCode);
  promisePassport.then((contract) => {
    return contract.evaluateTransaction('searchPassportByCountry', countryCode);
  }).then((buffer) => {

    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Changer la validité d'un passeport
router.get('/passport/valid/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  console.log(passNb);
  promisePassport.then((contract) => {
    return contract.submitTransaction('changePassportValidity', passNb);
  }).then((buffer) => {
    res.status(200).json({message : "Validity changed"});
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Génère des informations aléatoires pour un passeport
router.get('/passport/random', (req, res, next) => {
  const passeport = {
    autority: String(randomItem(["Préfecture de ", "Town hall of"])),
    dateOfExpiry: String(randomItem(["06/02/2020", "13/01/2020", "31/08/2022", "25/10/2019", "01/01/2024"])),
    dateOfBirth: String(randomItem(["03/03/1995", "13/01/1997", "08/12/1956", "25/12/2001", "12/06/1983"])),
    dateOfIssue: String(randomItem(["06/02/2010", "13/01/2010", "31/08/2012", "25/10/2009", "01/01/2014"])),
    eyesColor: String(randomItem(["blue", "brown", "green", "gray", "black"])),
    height: String(randomItem(["1.45", "1.57", "1.98", "1.77", "1.62", "1.85", "1.59"])),
    name: String(randomItem(["Carla", "John", "Mathieu", "Julie", "Anne", "Jean-Baptiste", "Alexandre"])),
    nationality: String(randomItem(["French", "German", "British", "American", "Japanese", "Brazilian"])),
    passNb: randomstring.generate(8),
    passOrigin: String(randomItem(["France", "Germany", "United Kingdom", "United States", "Japan", "Brazil"])),
    placeOfBirth: String(randomItem(["France", "Germany", "United Kingdom", "United States", "Japan", "Brazil"])),
    residence: String(randomItem(["Avenue des Facultés, 33400 Talence", "600-8216, Kyōto-fu, Kyōto-shi, Shimogyō-ku, Higashi-Shiokōji 721-1", "455 Larkspur Dr. California Springs, CA 92926"])),
    sex: String(randomItem(["M", "F", "NB"])),
    surname: String(randomItem(["Smith", "Legrand", "Brown", "Bach", "Williams", "Bernard", "Adamovitch"])),
    type: String(randomItem(["P", "D"])),
    validity: String(randomItem(["Y", "N"])),
    image: "req.body.image"
  };
  res.status(200).json(passeport);
});

//Créer un passeport
router.post('/passport', checkAuth, (req, res, next) => {

  const autority = req.body.autority;
  const countryCode = res.locals.countryCode;
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
  const image = req.body.image;
  var password = "azerty";
  //var password = randomstring.generate(12);
  const salt = "NIPs";
  console.log('Ajout d\' un passeport');


  promisePassport.then((contract) => {
    return contract.submitTransaction('createPassport', type, countryCode, 
    passNb, name, surname, dateOfBirth, nationality, sex, 
    placeOfBirth, height, autority, residence, eyesColor, 
    dateOfExpiry, dateOfIssue, passOrigin, validity, hash(password.concat(salt)), image);
  }).then((buffer) => {
    res.status(200).json({
      message: 'Transaction has been submitted',
      password: password
    });
  }).catch((error) => {
    res.status(200).json({
      error: error
    });
  });
});

//Récupérer le passeport d'un citoyen
router.get('/passport/one/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  promisePassport.then((contract) => {
    return contract.evaluateTransaction('queryPassportsByPassNb', passNb);
  }).then((buffer) => {
    console.log("ok\n");
    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Modifier un citoyen
router.put('/passport/update', checkAuth, (req, res, next) => {
  if(res.locals.admin){
    const autority = req.body.autority;
    const countryCode = res.locals.countryCode;
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
    const image = req.body.image;

    promisePassport.then((contract) => {
    return contract.submitTransaction('changePassport', type, countryCode, 
      passNb, name, surname, dateOfBirth, nationality, sex, 
      placeOfBirth, height, autority, residence, eyesColor, 
      dateOfExpiry, dateOfIssue, passOrigin, validity, image);
    }).then((buffer) => {
      res.status(200).json({
        message: 'Transaction has been submitted'
      });
    }).catch((error) => {
      res.status(200).json({
        error
      });
    });
  }else{
    res.status(401).json({
      message:'No right'
    });
  }
});

//Recherche de passeports
router.post('/passport/search', checkAuth, (req, res, next) => {
  var info = {
    autority: req.body.autority,
    countryCode: res.locals.countryCode,
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
    return contract.evaluateTransaction('searchPassportByCountry', info.countryCode); //On récupère les passeports d'un pays
  }).then((buffer) => {
    var passports = JSON.parse(buffer.toString());
    keys.forEach(function(key) {
      if (info[key] !== undefined){  
        for (var ii =  0; ii< passports.length; ii++){
          console.log(passports[ii].infos[key]);
          if (passports[ii].infos[key] !== info[key]){
            delete passports[ii];
          }
        }
      }
    });
    var anwser = passports.filter(function(val){return val !== ''});
    res.status(200).json(anwser);
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });

});


////////////// Visa //////////////

//Récupérer tous les visas
router.get('/visa', checkAuth, (req, res, next) => {


  promiseVisa.then((contract) => {
    return contract.evaluateTransaction( 'queryAllVisas' );
  }).then((buffer) => {
    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Créer un visa
router.post('/visa', checkAuth, (req, res, next) => {
  const type  = req.body.type;
	const visaCode = req.body.visaCode;
	const passNb   = req.body.passNb;
	const name     = req.body.name;
	const surname  = req.body.surname;
	const autority        = req.body.autority;
	const dateOfExpiry    = req.body.dateOfExpiry;
	const dateOfIssue     = req.body.dateOfIssue;
	const placeOfIssue    = req.body.placeOfIssue;
	const validity        = req.body.validity;
	const validFor        = req.body.validFor;
	const numberOfEntries = req.body.numberOfEntries;
	const durationOfStay  = req.body.durationOfStay;
  const remarks = req.body.remarks;

  promiseVisa
  .then((contract) => {
    return contract.submitTransaction('createVisa', type, visaCode, passNb, 
    name, surname, autority, dateOfExpiry, 
    dateOfIssue, placeOfIssue, validity, validFor, numberOfEntries, durationOfStay, remarks);
  })
  .then((buffer) => {
    res.status(200).json({
      message: 'Transaction has been submitted',
      moreDetails: buffer 
    });
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Récupérer les visas d'un pays
router.get('/visa/all/:countryCode', checkAuth, (req, res, next) => {
  const countryCode = req.params.countryCode;
  console.log(countryCode);
  promiseVisa.then((contract) => {
    return contract.evaluateTransaction('queryVisasByCountry', countryCode);
  }).then((buffer) => {

    res.status(200).json(JSON.parse(buffer.toString()));
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

//Récupérer les visas d'un citoyen
router.get('/visa/one/:passNb', checkAuth, (req, res, next) => {
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
