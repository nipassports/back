const mongoose = require('mongoose');


const governmentUserSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    identifiant: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String,
        required: true 
    },
    countryCode: { 
        type: String,
        required: true 
    },
    admin: {
        type : Boolean,
        required : true
    }
});

module.exports = mongoose.model('governmentUser' , governmentUserSchema );