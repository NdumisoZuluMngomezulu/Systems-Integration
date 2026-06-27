const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema(
    {
        name : {type: String, required: true, trim: true},
        address : {type: String, required: true, trim: true},
        suburb : {type: String, trim: true},
        municipality : {
            type: String,
            enum: [
                'City of Johannesburg',
                'City of Tshwane',
                'Ekurhuleni',
                'West Rand',
                'Sedibeng'
            ],
            required : true
        },
        //Geo JSON Point : coordinates are [longitude, latitude] - order is important
        location : {
            type : {type: String, enum : ['Point'], default: 'Point'},
            coordinates : {type : [Number], required: true}
        },
        capacity: { type : Number, default: null},
        serversGender : {
            type : String,
            enum: ['men','women','children','families','any'],
            default : 'any'
        },
        servicesOffered : [{type: String}], //beds, meals, shower, counselling, church, funds, employment, daycare
        fundedStatus : {
            type: String,
            enum: ['funded','unfunded','unknown'],
            default: 'unknown'
        },
        contact:{
            phone: {type: String, trim: true},
            email: {type: String, trim: true}
        },
        notes: {type: String, trim: true},
        verifiedAt: { type: Date, default:Date.now}

    },
    {timestamps: true}
);

//Required for geoNear and near queries
shelterSchema.index({ location: '2dsphere'});

module.exports = mongoose.model('Shelter', shelterSchema);