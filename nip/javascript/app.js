// eslint-disable-next-line strict
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');
const mongoose  = require('mongoose');
const smartContract = require('./smartContract.js');
const promisePassport = smartContract(3,'passport');
var randomstring = require("randomstring");
var sleep = require('sleep');
var hash = require('object-hash');

const amqp = require('amqplib');

// RabbitMQ connection string
const messageQueueConnectionString = "amqp://localhost";

mongoose.connect('mongodb+srv://ozemzami:7ZuoZkVIJcYjpb2l@nips-q4sgv.mongodb.net/test?retryWrites=true', { useNewUrlParser: true })

const citizenRoute = require('./routes/citizen');
const governmentRoute = require('./routes/government');
const customRoute = require('./routes/custom');
const adminRoute = require('./routes/admin');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '50mB'}));

app.use((req, res, next) => {
    res.header('Access-control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use('/citizen' , citizenRoute);
app.use('/government' , governmentRoute);
app.use('/custom' , customRoute);
app.use('/admin' , adminRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status= 404;
    next(error);
});

app.use((error, req, res, next) =>{
    res.status(error.status || 500);
    res.json({
        error: {
            message : error.message
        }
    });
});

const requestLoop = setInterval(function(){
    promisePassport.then( (contract) =>{
        return contract.evaluateTransaction('queryAllPassports');
    }).then((buffer)=>{
        let passports = JSON.parse(buffer.toString());
        passports.forEach(passport => {
            let sdate=passport.infos.dateOfExpiry;
            let date1= new Date();
            let today= new Date();
            date1.setFullYear(sdate.substr(6,4));
            date1.setMonth(sdate.substr(3,2));
            date1.setDate(sdate.substr(0,2));
            date1.setHours(0);
            date1.setMinutes(0);
            date1.setSeconds(0);
            date1.setMilliseconds(0);
            let d1=date1.getTime();
            if(d1< today.getTime()){
                promisePassport.then( (contract) =>{
                    return contract.submitTransaction('changePassportValidity', passport.infos.passNb);
                }).then((buffer) => {
                    console.log("Validity changed");
                });
            }else{
                console.log("no changes");
            }
        });
            
        });

    
}, 86400000);



async function listenForMessages() {
    try {
      // connect to Rabbit MQ
      let connection = await amqp.connect(messageQueueConnectionString);
    
      // create a channel and prefetch 1 message at a time
      let channel = await connection.createChannel();
      await channel.prefetch(1);
    
      // create a second channel to send back the results
      let resultsChannel = await connection.createConfirmChannel();
    
      // start consuming messages
      consume({ connection, channel, resultsChannel });
  
    }catch (error){
      console.error(`${error}`);
      process.exit(1);
  
    }
    }
    
 // consume messages from RabbitMQ
  function consume({ connection, channel, resultsChannel }) {
    
      channel.consume("processing.requests", async function (msg) {
          // parse message
        let msgBody = msg.content.toString();
        let data = JSON.parse(msgBody);
        let requestId = data.requestId;
        let requestData = data.data;
        console.log("Received a request message, requestId:", requestId);
  
        // process data
        let processingResults = await processMessage(requestData);
        if(processingResults.length>1){
          const passNb = processingResults[1];
          const password = processingResults[2];
          processingResults=processingResults[0];
          await publishToChannel(resultsChannel, {
            exchangeName: "processing",
            routingKey: "result",
            data: { requestId, processingResults,passNb,password }
          });
        }else{
          // publish results to channel
          await publishToChannel(resultsChannel, {
          exchangeName: "processing",
          routingKey: "result",
          data: { requestId, processingResults }
        });
        }
        console.log("Published results for requestId:", requestId);
  
        // acknowledge message as processed successfully
        await channel.ack(msg);
      });
  
  }

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
  
  // simulate data processing that takes 5 seconds
  function processMessage(requestData) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const contract1 = await smartContract(3 , 'visa');
        const contract2 = await smartContract(3,'passport');
      try {
        switch(requestData.function){
          case 'createVisa' :
            await contract1.submitTransaction('createVisa', requestData.infos.type, requestData.infos.visaCode, requestData.infos.passNb, 
            requestData.infos.name, requestData.infos.surname, requestData.infos.autority, requestData.infos.dateOfExpiry, 
            requestData.infos.dateOfIssue, requestData.infos.placeOfIssue, requestData.infos.validity, requestData.infos.validFor, requestData.infos.numberOfEntries, requestData.infos.durationOfStay, requestData.infos.remarks);
            resolve(['Transaction has been submitted',requestData.infos.passNb,""]);
            break;

          case 'createPassport' :

            var password = randomstring.generate({length: 6,charset: 'numeric'});      
            const salt = "NIPs";
            await contract2.submitTransaction(requestData.function, requestData.infos.type, requestData.infos.countryCode, requestData.infos.passNb,
                requestData.infos.name, requestData.infos.surname, requestData.infos.dateOfBirth, requestData.infos.nationality, requestData.infos.sex, 
              requestData.infos.placeOfBirth, requestData.infos.height, requestData.infos.autority, requestData.infos.residence, requestData.infos.eyesColor, 
                requestData.infos.dateOfExpiry, requestData.infos.dateOfIssue, requestData.infos.passOrigin, requestData.infos.validity, hash(password.concat(salt)) , requestData.infos.image);
            resolve(['Transaction has been submitted',requestData.infos.passNb,password]);
            break;
          case 'changePassport' : 
            await contract2.submitTransaction('changePassport', requestData.infos.type, requestData.infos.countryCode, 
            requestData.infos.passNb, requestData.infos.name, requestData.infos.surname, requestData.infos.dateOfBirth, requestData.infos.nationality, requestData.infos.sex, 
            requestData.infos.placeOfBirth, requestData.infos.height, requestData.infos.autority, requestData.infos.residence, requestData.infos.eyesColor, 
            requestData.infos.dateOfExpiry, requestData.infos.dateOfIssue, requestData.infos.passOrigin, requestData.infos.validity, requestData.infos.image);
            sleep.sleep(10);
            resolve(['Transaction has been submitted',requestData.infos.passNb,""] );
            break;
          default :
            break;

        }
    } catch (error) {
        resolve(`Failed to submit transaction: ${error}`);
    }
      }, 500);
    });
  }
listenForMessages();


module.exports = app;
