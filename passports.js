const express = require('express');
const router = express.Router();

const smartContract = require('./smartContract.js');

const promise = smartContract();


//Query for all Passports
router.get('/', (req, res, next)=>{
    console.log("Query for all Passports");
    promise.then( (contract) =>{
        return contract.evaluateTransaction('queryAllPassports');
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
        console.log("No Passport found");
    });
});

//Create a Passport
router.post('/', (req, res, next)=>{
    console.log("Creating a Passport");
    const gender = req.body.gender;
    const birthplace = req.body.birthplace;
    const colour = req.body.colour;
    const owner  = req.body.owner;
    console.log('hello');

    promise.then( (contract) =>{
        return contract.submitTransaction('createPassport', '9', gender, birthplace, colour, owner);
    }).then((buffer)=>{
        res.status(200).json({
            message: 'Transaction has been submitted'
        });
        console.log("A Passport has been created");
    }).catch((error)=>{
        res.status(200).json({
            error
        });
        console.log("Problem during the creation :");
        console.log(error.toString());
    });
});

//Query a Passport with the ID
router.get('/:passportId' , (req, res, next)=> {
    console.log("Query for a Passport");
    const id = req.params.passportId;
    promise.then( (contract) =>{
        return contract.evaluateTransaction('queryPassport',id);
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
        console.log("Passport found");
    }).catch((error)=>{
        res.status(200).json({
            error
        });
        console.log("No Passport found");
    });
});

//Modify a Passport
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