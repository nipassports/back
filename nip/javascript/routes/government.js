// eslint-disable-next-line strict
const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const ObjectID = require('mongodb').ObjectID;

const amqp = require('amqplib');



//Include pour les connexions (blockchain et mangoDB)
const smartContract = require('../smartContract.js');
const promisePassport = smartContract(3,'passport');
const promiseVisa = smartContract(3,'visa');
const GovernmentUser = require('../models/governmentUser');
const Problem = require('../models/problem');
const checkAuth = require('../middleware/check-authGovernment');
const JWT_KEY = "secret-government";

//Include pour les problémes
const MongoClient = require('mongodb').MongoClient;
const url_problem = 'mongodb://localhost:27017/problem_manager';
const url_governmentUser = 'mongodb://localhost:27017/government_user_manager';


//Include pour le password
var randomItem = require('random-item');
var randomstring = require("randomstring");
var hash = require('object-hash');

//Authentifiction

// RabbitMQ connection string
const messageQueueConnectionString = "amqp://localhost";

// simulate request ids
let lastRequestId = 1;

let arrayRequests= new Array() ; 


MongoClient.connect( url_governmentUser,  { useNewUrlParser: true }, (err,client) => {
  if(err){
      console.error(err)
      return
  }
  const db = client.db("government_user_manager")
  const GovernmentUser = db.collection("government")


router.post("/auth", (req, res, next) => {
  GovernmentUser.findOne({
      identifiant: req.body.identifiant
    })
    .then(governmentUser => {
      if (!governmentUser) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      bcrypt.compare(req.body.password, governmentUser.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        if (result) {

          const token = jwt.sign({
              identifiant: governmentUser.identifiant,
              password: governmentUser.password,
              countryCode : governmentUser.countryCode,
              admin: governmentUser.admin
            },
            JWT_KEY, {
              expiresIn: "90min"
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
	    countryCode: governmentUser.countryCode,
            admin: governmentUser.admin
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
  

// récupérer les problemes
router.get('/problems/all', checkAuth, (req, res, next) => {
  options = {
    "sort": {"date" : -1},
    "limit": 10
};
  Problem.find({ countryCode: res.locals.countryCode,status:"new"},options)
    .toArray()
    .then(problem => (problem) ? res.status(201).json(problem) : res.status(250).json({ message: "no problems declared " }))
    .catch(err => console.log("err" + err))
})
// récupérer les problemes
router.get('/problems/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  options = {
    "sort": {"date" : -1},
    "limit": 10
  };
  Problem.find({ countryCode: res.locals.countryCode,passNb:passNb},options).toArray()
    .then(problem => (problem) ? res.status(201).json(problem) : res.status(250).json({ message: "no problems declared " }))
    .catch(err => console.log("err" + err))
})

router.post('/problems/:id', checkAuth, (req, res, next) => {
  
  Problem.findOne({ _id : ObjectID(req.params.id)})
  .then(problem => {
    console.log(problem.countryCode);
    problem.status="treated";
   
    if (problem!==null){
      Problem.updateOne({_id : ObjectID(req.params.id)},{$set:problem},{upsert:true}).then(
        result => {
          console.log(problem.status);
          console.log(result);
          res.status(201).json({
            message: "status  modified"
            })} );
          }
        else {
          res.status(201).json({
            message: "problem not found"
          })
        }
      }
      ).catch(err => console.log("err" + err))
})


});
////////////// Passeports //////////////

//Récupérer les passeports d'un pays
router.get('/passport/all', checkAuth, (req, res, next) => {
  const countryCode = res.locals.countryCode;
  console.log("Demande du pays: "+countryCode);
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
    passNb: randomstring.generate({length: 5, charset: 'alphabetic', capitalization: 'lowercase'
}),
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
router.post('/passport', checkAuth, async (req, res, next) => {
  try{
    // save request id and increment
    let requestId = lastRequestId;
    lastRequestId++;

    // connect to Rabbit MQ and create a channel
    let connection = await amqp.connect(messageQueueConnectionString);
    let channel = await connection.createConfirmChannel();

    const data = {
      function : "createPassport",
      infos : {
        autority : req.body.autority,
        countryCode : req.body.countryCode,
        dateOfExpiry : req.body.dateOfExpiry,
        dateOfBirth : req.body.dateOfBirth,
        dateOfIssue : req.body.dateOfIssue,
        eyesColor : req.body.eyesColor,
        height : req.body.height,
        name : req.body.name,
        nationality : req.body.nationality,
        passNb : req.body.passNb,
        passOrigin : req.body.passOrigin,
        placeOfBirth : req.body.placeOfBirth,
        residence : req.body.residence,
        sex : req.body.sex,
        surname : req.body.surname,
        type : req.body.type,
        validity : req.body.validity,
        image : req.body.image
      }
    }
    console.log("Published a request message, requestId:", requestId);
    await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: { requestId, data } });

    res.status(200).json({
      requestId : requestId
    })
}catch(error){
  console.error(`${error}`);
  process.exit(1);
}

});




router.get('/passport/results', async (req, res, next) => {

  res.status(200).json({
    message : arrayRequests
  })
});


router.get('/passport/result/:requestId', async (req, res, next) => {
  let done=0;
  const requestId = req.params.requestId;
  arrayRequests.forEach(element => {
    if(requestId.toString()===element.requestId.toString()){
      done++;
      res.status(200).json({
        requestId : element.requestId,
        processingResults : element.processingResults,
        data : {
          passNb : element.passNb,
          password : element.password
        }
      })
    }
  });
  if(done===0){
    res.status(200).json({
      requestId : requestId,
      processingResults : "not handled yet",
      data : {
        passNb : "",
        password : ""
      }
    })
  }
});

//Récupérer le passeport d'un citoyen
router.get('/passport/one/:passNb', checkAuth, (req, res, next) => {
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

//Modifier un citoyen
router.put('/passport/update', checkAuth, async (req, res, next) => {
  try{

    if(res.locals.admin){
        // save request id and increment
      let requestId = lastRequestId;
      lastRequestId++;

      // connect to Rabbit MQ and create a channel
      let connection = await amqp.connect(messageQueueConnectionString);
      let channel = await connection.createConfirmChannel();
      const data = {
        function : 'changePassport',
        infos : {
          autority : req.body.autority,
          countryCode : req.body.countryCode,
          dateOfExpiry : req.body.dateOfExpiry,
          dateOfBirth : req.body.dateOfBirth,
          dateOfIssue : req.body.dateOfIssue,
          eyesColor : req.body.eyesColor,
          height : req.body.height,
          name : req.body.name,
          nationality : req.body.nationality,
          passNb : req.body.passNb,
          passOrigin : req.body.passOrigin,
          placeOfBirth : req.body.placeOfBirth,
          residence : req.body.residence,
          sex : req.body.sex,
          surname : req.body.surname,
          type : req.body.type,
          validity : req.body.validity,
          image : req.body.image
        }
      }
      console.log("Published a request message, requestId:", requestId);
      await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: { requestId, data } });

    res.status(200).json({
      requestId : requestId
    })

    }else{
      res.status(401).json({
        message:'No right'
      });
    }
}catch(error){
  console.error(`${error}`);
  process.exit(1);
}
});

//Recherche de passeports
router.post('/passport/search', checkAuth, (req, res, next) => {
  const info = {
    autority: req.body.autority,
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
  keys = ['autority', 'dateOfExpiry', 'dateOfBirth', 'dateOfIssue', 'eyesColor', 'height', 'name', 'nationality', 'passNb', 'passOrigin', 'placeOfBirth', 'residence', 'sex', 'surname', 'type', 'validity'];
  promisePassport.then((contract) => {
    return contract.evaluateTransaction('searchPassportByCountry', res.locals.countryCode); //On récupère les passeports d'un pays
  }).then((buffer) => {
    var passports = JSON.parse(buffer.toString());
    keys.forEach(function(key) {
      if (info[key] !== undefined){  
        for (var ii =  0; ii< passports.length; ii++){;
          if (passports[ii].infos[key] !== info[key]){
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

//Régénération de pot de passe
router.get('/passport/newPassword/:passNb', checkAuth, (req, res, next) => {
  const passNb = req.params.passNb;
  var password = randomstring.generate(12);
  const salt = "NIPs";
  promisePassport.then((contract) => {
    return contract.submitTransaction('changePassword', passNb, hash(password.concat(salt)));
  }).then((buffer) => {
    res.status(200).json({
      password: password,
      message: "Password changed"
    });
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
router.post('/visa', checkAuth, async (req, res, next) => {
  try{
    // save request id and increment
    let requestId = lastRequestId;
    lastRequestId++;

    // connect to Rabbit MQ and create a channel
    let connection = await amqp.connect(messageQueueConnectionString);
    let channel = await connection.createConfirmChannel();
    const data = {
      function : "createVisa",
      infos : {
        type  : req.body.type,
        visaCode : req.body.visaCode,
        passNb   : req.body.passNb,
        name     : req.body.name,
        surname  : req.body.surname,
        autority        : req.body.autority,
        dateOfExpiry    : req.body.dateOfExpiry,
        dateOfIssue     : req.body.dateOfIssue,
        placeOfIssue    : req.body.placeOfIssue,
        validity        : req.body.validity,
        validFor        : req.body.validFor,
        numberOfEntries : req.body.numberOfEntries,
        durationOfStay  : req.body.durationOfStay,
        remarks : req.body.remarks
      }
    }

    console.log("Published a request message, requestId:", requestId);
    await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: { requestId, data } });

    res.status(200).json({
      requestId : requestId
    })

}catch (error) {
  console.error(`${error}`);
  process.exit(1);
}
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



// utility function to publish messages to a channel
function publishToChannel(channel, { routingKey, exchangeName, data }) {
  return new Promise((resolve, reject) => {
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true }, function (err, ok) {
      if (err) {
        return reject(err);
      }

      resolve();
    })
  });
}

async function listenForResults() {
  try {
      // connect to Rabbit MQ
      let connection = await amqp.connect(messageQueueConnectionString);

      // create a channel and prefetch 1 message at a time
      let channel = await connection.createChannel();
      await channel.prefetch(1);

      // start consuming messages
      await consume({ connection, channel });
  }catch(error) {
    console.error(`${error}`);
    process.exit(1);
  }
}


// consume messages from RabbitMQ
function consume({ connection, channel, resultsChannel }) {
  return new Promise((resolve, reject) => {
    channel.consume("processing.results", async function (msg) {
      // parse message
      let msgBody = msg.content.toString();
      let data = JSON.parse(msgBody);
      arrayRequests.push(data);
      // acknowledge message as received
      await channel.ack(msg);
    });

    // handle connection closed
    connection.on("close", (err) => {
      return reject(err);
    });

    // handle errors
    connection.on("error", (err) => {
      return reject(err);
    });
  });
}

listenForResults();



module.exports = router;
