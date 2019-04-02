const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const CustomUser = require('../models/customUser');
const GouvernmentUser = require('../models/gouvernmentUser');

router.post("/addCustomUser", (req, res, next) => {
    CustomUser.find({ identifiant: req.body.identifiant })
    .exec()
    .then(customUser => {
      if (customUser.length >= 1) {
        return res.status(409).json({
          message: "Mail exists"
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const customUser = new CustomUser({
              _id: new mongoose.Types.ObjectId(),
              identifiant: req.body.identifiant,
              password: hash,
              countryCode: req.body.countryCode
            });
            customUser
              .save()
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
    CustomUser.find()
      .select("_id identifiant password countryCode")
      .exec()
      .then(docs => {
        const response = {
          count: docs.length,
          CustomUser: docs.map(doc => {
            return {
                identifiant: doc.identifiant,
                password: doc.password,
                countryCode: doc.countryCode,
              _id: doc._id
            };
          })
        };
        res.status(200).json(response);
        
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });

  router.post("/addGouvernmentUser", (req, res, next) => {
    GouvernmentUser.find({ identifiant: req.body.identifiant })
    .exec()
    .then(gouvernmentUser => {
      if (gouvernmentUser.length >= 1) {
        return res.status(409).json({
          message: "Mail exists"
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const gouvernmentUser = new GouvernmentUser({
              _id: new mongoose.Types.ObjectId(),
              identifiant: req.body.identifiant,
              password: hash,
              countryCode: req.body.countryCode,
              admin: req.body.admin
            });
            gouvernmentUser
              .save()
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

router.get("/GouvernmentUser", (req, res, next) => {
    GouvernmentUser.find()
      .select("_id identifiant password countryCode")
      .exec()
      .then(docs => {
        const response = {
          count: docs.length,
          GouvernmentUser: docs.map(doc => {
            return {
                identifiant: doc.identifiant,
                password: doc.password,
                countryCode: doc.countryCode,
                admin: req.body.admin,
              _id: doc._id
            };
          })
        };
        res.status(200).json(response);
        
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });

module.exports = router;