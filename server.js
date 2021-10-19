require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const path = require('path')

const app = express()
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(fileUpload({ useTempFiles: true }))

// app.use('/', (req, res, next) => {
//     res.json({ msg: "Hello Everyone" })
// })

//ROUTES
app.use('/user', require('./routes/userRouter'))
app.use('/api', require('./routes/uploadRouter'))

// const URI = process.env.MONGO_URI
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, () => {
    console.log("connected to mongoDB")
})
// mongoose.connect(
//     'mongodb://solaogun:Adebule7@cluster0.6yznv.mongodb.net/full_auth?retryWrites=true&w=majority',
//     {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     }).then(() => console.log("MongoDB connected")).catch((err) => console.log(err));


app.listen(5000, () => {
    console.log("Backend server is running")
})
