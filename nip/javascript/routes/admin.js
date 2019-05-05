const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ObjectID = require('mongodb').ObjectID;

const CustomUser = require('../models/customUser');
const GovernmentUser = require('../models/governmentUser');


const MongoClient = require('mongodb').MongoClient;
const url_customUser = 'mongodb://localhost:27017/custom_user_manager';
const url_governmentUser = 'mongodb://localhost:27017/government_user_manager';

MongoClient.connect( url_customUser,  { useNewUrlParser: true }, (err,client) => {
  if(err){
      console.error(err)
      return
  }
  const db = client.db("custom_user_manager")
  const CustomUser = db.collection("custom")


router.post("/addCustomUser", (req, res, next) => {
    CustomUser.findOne({ identifiant: req.body.identifiant })
    .then(customUser => {
      
      if (customUser) {
        return res.status(409).json({
          message: "user exists"
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const customUser = ({
              identifiant: req.body.identifiant,
              password: hash
            });
            CustomUser
              .insert(customUser)
              .then(result => {
                console.log(result);
                res.status(201).json({
                  message: "User created"
                });
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  error: err
                });
              });
          }
        });
      }
    });
});

router.get("/CustomUser", (req, res, next) => {
    CustomUser.find().toArray()
      .then(response => {
            
        res.status(200).json(response);
        
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });
})


MongoClient.connect( url_governmentUser,  { useNewUrlParser: true }, (err,client) => {
  if(err){
      console.error(err)
      return
  }
  const db = client.db("government_user_manager")
  const GovernmentUser = db.collection("government")


  router.post("/addGovernmentUser", (req, res, next) => {
    GovernmentUser.findOne({ identifiant: req.body.identifiant })
    .then(governmentUser => {
      if (governmentUser) {
        return res.status(409).json({
          message: "user exists"
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const governmentUser =({
              identifiant: req.body.identifiant,
              password: hash,
              countryCode: req.body.countryCode,
              admin: req.body.admin
            });
            GovernmentUser
              .insert(governmentUser)
              .then(result => {
                console.log(result);
                res.status(201).json({
                  message: "User created"
                });
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  error: err
                });
              });
          }
        });
      }
    });
});

router.get("/GovernmentUser", (req, res, next) => {
    GovernmentUser.find().toArray()
      .then(response => {
        res.status(200).json(response);}
        
      )
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });
})

module.exports = router;