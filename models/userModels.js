const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please write your name!']
    },
    email: {
        type: String,
        required: [true, 'please write your name!'],
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, 'please write your name!']
    },
    role: {
        type: Number,
        default: 0 //0=user, 1= admin
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/soft-alliance/image/upload/v1633975095/samples/people/boy-snow-hoodie.jpg"
    }
}, { timestamps: true }
)


module.exports = mongoose.model("Users", userSchema)