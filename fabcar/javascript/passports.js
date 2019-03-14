const express = require('express');
const router = express.Router();

const smartContract = require('./smartContract.js');

const promise = smartContract();

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
router.post('/auth', (req, res, next) => {
    const num = req.body.numpas;
    const pwd = req.body.pwdpas;
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
        return contract.evaluateTransaction('validNumPwd',id);
    }).then((buffer)=>{
        res.status(200).json(JSON.parse(buffer.toString()));
    }).catch((error)=>{
        res.status(200).json({
            error
        });
    });*/
});

router.post('/', (req, res, next)=>{
    const Type         = req.body.Type         
	const CountryCode  = req.body.CountryCode  
	const PassNb       = req.body.PassNb       
	const Name         = req.body.Name         
	const Surname      = req.body.Surname      
	const DateOfBirth  = req.body.DateOfBirth  
	const Nationality  = req.body.Nationality  
	const Sex          = req.body.Sex          
	const PlaceOfBirth = req.body.PlaceOfBirth 
	const Height       = req.body.Height       
	const Autority     = req.body.Autority     
	const Residence    = req.body.Residence    
	const EyesColor    = req.body.EyesColor    
	const DateOfExpiry = req.body.DateOfExpiry 
	const DateOfIssue  = req.body.DateOfIssue  
	const PassOrigin   = req.body.PassOrigin   
	const Validity     = req.body.Validity     
	const Password     = req.body.Password     
    console.log('hello');

    promise.then( (contract) =>{
        return contract.submitTransaction('createPassport',Type,CountryCode ,PassNb ,Name ,Surname ,DateOfBirth ,Nationality ,Sex ,PlaceOfBirth,Height ,Autority ,Residence ,EyesColor , DateOfExpiry , DateOfIssue,PassOrigin,Validity,Password);
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