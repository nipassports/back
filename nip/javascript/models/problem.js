const mongoose = require('mongoose');


const problemSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    passNb: { 
        type: String, 
        required: true   
    },
    message: { 
        type: String,
        required: true 
    },
    countryCode : {
        type: String,
        required: true 
        },
    type: { 
        type: String,
        required: true 
    },
    date:{
        type : String,
        required : true
    },
    email:{
        type : String,
        required : true
    },
    title:{
        type : String,
        required : true
    },
    author:{
        type : Boolean,
        required : true
    },
    status: {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('problem', problemSchema );