// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");
const router = express.Router();
const checkAuth = require('../middleware/check-authCustom.js');
const ObjectID = require('mongodb').ObjectID;

const JWT_KEY = "secret-custom";

const smartContract = require('../smartContract.js');
const promisePassport = smartContract(2, 'passport');
const promiseVisa = smartContract(2, 'visa');



const MongoClient = require('mongodb').MongoClient;
const url_problem = 'mongodb://localhost:27017/problem_manager';
const url_customUser = 'mongodb://localhost:27017/custom_user_manager';


var hash = require('object-hash');

const Problem = require('../models/problem')
const CustomUser = require('../models/customUser');


MongoClient.connect( url_customUser,  { useNewUrlParser: true }, (err,client) => {
  if(err){
      console.error(err)
      return
  }
  const db = client.db("custom_user_manager")
  const CustomUser = db.collection("custom")


//Authentifiction
router.post("/auth", (req, res, next) => {
  CustomUser.findOne({
      identifiant: req.body.identifiant
    })
    .then(customUser => {
      if (!customUser) {
        console.log("here"+customUser);
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      bcrypt.compare(req.body.password, customUser.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        if (result) {
          const token = jwt.sign({
              identifiant: customUser.identifiant,
              password: customUser.password
            },
            JWT_KEY, {
              expiresIn: "90min"
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
})

////////////////////Probléme/////////

MongoClient.connect(url_problem,  { useNewUrlParser: true }, (err,client) => {
  if(err){
      console.error(err)
      return
  }
  const db = client.db("problem_manager")
  const Problem = db.collection("problem")
  
  //déclarer un probléme  
  router.post('/problem',  checkAuth,(req, res, next) => {
    const passNb = req.params.passNb;
    promisePassport.then((contract) => {
      return contract.evaluateTransaction('queryPassportsByPassNb', passNb);


    }).then((buffer) => {
    const countryCode=JSON.parse(buffer.toString()).countryCode.toString();
     const problem=({
      passNb : req.body.passNb,
      message : req.body.message,
      countryCode : countryCode,
      type : req.body.type,
      date : moment().format('DD/MM/YYYY at HH:mm'),
      email : req.body.email,
      title : req.body.title,
      author : 1,
      status : 'new'
      });
      Problem.insert(problem)
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


    })
        }).catch((error) => {
          res.status(200).json({
            error
          });
        });
        ;  
  });
  
  
//supprimer un probleme
  router.delete('/problems/deleteAll', checkAuth, (req, res, next) => {
    Problem.remove({})
    .then(result =>  res.status(201).json(result) )
    .catch(err => console.log("err" + err))
  });

//recevoir tous les probleme mode develop
router.get('/problems/All', checkAuth, (req, res, next) => {
  options = {
    "sort": {"date" : -1},
    "limit": 10
};
  Problem.find({},options).toArray()
    .then(problem => (problem) ? res.status(201).json(problem) : res.status(250).json({ message: "no problems declared " }))
    .catch(err => console.log("err" + err))
});


//recevoir un probleme
router.get('/problems/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  options = {
    "sort": {"date" : -1},
    "limit": 10
};
  Problem.find({passNb:passNb},options).toArray()
    .then(problem => (problem) ? res.status(201).json(problem) : res.status(250).json({ message: "no problems declared " }))
    .catch(err => console.log("err" + err))
})
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
  const info = {
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
	passports = passports.filter(function(val){return val !== ''});
      }
    });
    console.log(passports.length + "passeports correspondent à la recherche");
    res.status(200).json(passports);
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
