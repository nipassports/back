// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const checkAuth = require('../middleware/check-authGouvernment');
const JWT_KEY = "secret-gouvernment";

const smartContract = require('../smartContract.js');
const promisePassport = smartContract(3,'passport');
const promiseVisa = smartContract(3,'visa');

var randomItem = require('random-item');
var randomstring = require("randomstring");
var hash = require('object-hash');
const GouvernmentUser = require('../models/gouvernmentUser');


router.post("/auth", (req, res, next) => {
  GouvernmentUser.find({
      identifiant: req.body.identifiant
    })
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

          const token = jwt.sign({
              identifiant: gouvernmentUser[0].identifiant,
              password: gouvernmentUser[0].password,
              countryCode : gouvernmentUser[0].countryCode,
              admin: gouvernmentUser[0].admin
            },
            JWT_KEY, {
              expiresIn: "5min"
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
	    countryCode: gouvernmentUser[0].countryCode,
            admin: gouvernmentUser[0].admin
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


router.get('/passport/all/:countryCode', checkAuth, (req, res, next) => {
  const countryCode = req.params.countryCode;
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

router.get('/valid/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  console.log(passNb);
  promise.then((contract) => {
    return contract.evaluateTransaction('changePassportValidity', passNb);
  }).then((buffer) => {
    res.status(200).json({message : "Validity changed"});
  }).catch((error) => {
    res.status(200).json({
      error
    });
  });
});

router.get('/random', (req, res, next) => {
  const passeport = {
    autority: String(randomItem(["Préfecture de ", "Town hall of"])),
    countryCode: String(randomItem(["FR", "DE", "UK", "US", "JP", "BR"])),
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

router.post('/passport', checkAuth, (req, res, next) => {

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
  const image = req.body.image;

  var password = randomstring.generate(12);
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

router.put('/passport/update', checkAuth, (req, res, next) => {
  if(res.locals.admin){
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


module.exports = router;
