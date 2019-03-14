// eslint-disable-next-line strict
const express = require('express');
const router = express.Router();

const smartContract = require('./smartContract.js');
const promise = smartContract();

var randomstring = require("randomstring");
var hash = require('object-hash');

router.get('/', (req, res, next)=>{
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
    const num = req.body.passNb;
    const pwd = req.body.password;
    var user = "1234";
    var mdp = "azerty";
    var n1 = user.localeCompare(num);
    var n2 = mdp.localeCompare(pwd);
    if (n1 == 0 && n2 == 0){
        res.status(200).send("3");
    }
    else {
        res.status(200).send("5");
    }
    /*
    promise.then( (contract) => {
        const salt = "NIPs";
        return contract.evaluateTransaction('validNumPwd',passNb, hash(pwd.concat(salt)) );
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });*/
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

    var password = randomstring.generate(12);
    const salt = "NIPs";
    res.status(200).send(password);
    console.log('Ajout d\' un passeport');

    promise.then( (contract) =>{
        return contract.submitTransaction('createPassport', type , countryCode , passNb , name , surname , dateOfBirth , nationality , sex , placeOfBirth , height , autority , residence , eyesColor , dateOfExpiry , dateOfIssue , passOrigin , validity, hash(password.concat(salt)), image );
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

router.get('/:passportId' , (req, res, next)=> {
    const id = req.params.passportId;
    promise.then( (contract) =>{
        return contract.evaluateTransaction('queryPassport',id);
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });
});

router.post('/update/', (req, res, next)=>{
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