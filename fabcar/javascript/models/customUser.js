const mongoose = require('mongoose');


const customUserSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    identifiant: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { type: String, required: true },
    countryCode: { type: String, required: true }
});

module.exports = mongoose.model('customUser' , customUserSchema );