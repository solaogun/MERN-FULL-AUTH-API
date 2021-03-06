
const Users = require('../models/userModels')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendMail = require('../controllers/sendMail')
const { google } = require('googleapis')
const { OAuth2 } = google.auth
const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID)

const { CLIENT_URL } = process.env

const userControl = {
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body
            // console.log(name, email, password)
            if (!name || !email || !password)
                return res.status(400).json("please fill in all fields")

            if (!validateEmail(email))
                return res.status(400).json("invalid emails")

            const user = await Users.findOne({ email })
            if (user) return res.status(200).json("This email already exist")

            if (password.length < 6) return res.status(400).json("Password must be at least 6")

            const passwordHash = await bcrypt.hash(req.body.password, 12)
            // console.log({ password, passwordHash })

            // const newUser = new Users({
            //     name, email, password: passwordHash
            // })
            // console.log(newUser)

            const newUser = {
                name, email, password: passwordHash
            }
            // console.log(newUser)

            const activation_token = createActivationToken(newUser)
            const url = `${CLIENT_URL}/user/activate/${activation_token}`
            sendMail(email, url, "verify your email address")
            // console.log({ activation_token })
            res.json({ msg: "Register success! Please activate your account to start" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    activateEmail: async (req, res) => {
        try {
            const { activation_token } = req.body
            const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)
            console.log(user)

            const { name, email, password } = user

            const check = await Users.findOne({ email })
            if (check) return res.status(400).json({ msg: "This email already exist" })
            //new user
            const newUser = new Users({
                name, email, password
            })

            //save user
            await newUser.save()
            res.json({ msg: "Account has been activated" })

        } catch (err) {
            console.log(err)
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body
            const user = await Users.findOne({ email })
            if (!user) return res.status(400).json({ msg: "This email does not exist" })

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) return res.status(400).json({ msg: "Password is incorrect" })
            console.log(user)

            const refresh_token = createRefreshToken({ id: user._id })
            console.log(refresh_token, "Alhaja Java")
            res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7 * 24 * 60 * 60 * 1000
                // 7days
            })

            res.json({ msg: "Login success" })
        } catch (err) {
            res.status(500).json({ msg: err.message })
        }
    },
    getAccessToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;

            console.log(rf_token, 'hhhhhhwe die here')
            if (!rf_token) return res.status(400).json({ msg: "Please login now!" })

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                console.log('ERR', err);
                console.log('USER', user);
                if (err) return res.status(400).json({ msg: "say login now!" })
                console.log(user)

                const access_token = createAccessToken({ id: user.id })
                res.json({ access_token })
            })
            res.status(200).json({ msg: rf_token })

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body
            const user = await Users.findOne({ email })
            if (!user) return res.status(400).json({ msg: "This email does not exist" })

            const access_token = createAccessToken({ id: user._id })
            const url = `${CLIENT_URL}/user/reset/${access_token}`

            sendMail(email, url, "Reset your password")
            res.json({ msg: "Re-send the password, please check your email" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { password } = req.body
            const passwordHash = await bcrypt.hash(password, 12)

            console.log("REQ.USER<ID====>", req.user)
            await Users.findOneAndUpdate({ _id: req.user.id }, {
                password: passwordHash
            })
            res.json({ msg: "Password successfully changed" })
        } catch (err) {
            return res.status(500).json(err)
        }
    },
    getUserInfor: async (req, res) => {
        try {
            // console.log(user, "React lover")
            const user = await Users.findById(req.user.id).select('-password')
            res.json(user)

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    getUsersAllInfor: async (req, res) => {
        try {
            const users = await Users.find().select('-password')
            res.json(users)

            console.log(req.user)

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/user/refresh_token' })
            return res.json({ msg: "Logged out." })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    updateUser: async (req, res) => {
        try {
            const { name, avatar } = req.body
            await Users.findOneAndUpdate({ _id: req.user.id }, {
                name, avatar
            })
            res.json({ msg: "Update success" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    updateUsersRole: async (req, res) => {
        try {
            const { role } = req.body
            await Users.findOneAndUpdate({ _id: req.params.id }, {
                role
            })
            res.json({ msg: "Update success" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    deleteUser: async (req, res) => {
        try {

            await Users.findByIdAndDelete(req.params.id)
            res.json({ msg: "Delete success" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    googleLogin: async (req, res) => {
        try {
            const { tokenId } = req.body
            const verify = await client.verifyIdToken({ idToken: tokenId, audience: process.env.MAILING_SERVICE_CLIENT_ID })
            // console.log(verify)
            const { email_verified, email, name, picture } = verify.payload

            const password = email + process.env.GOOGLE_SECRET

            const passwordHash = await bcrypt.hash(password, 12)
            // console.log(verify, "Alhamdulilahi")

            if (!email_verified) return res.status(400).json({ msg: "Email verification failed." })

            const user = await Users.findOne({ email })
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password)
                if (!isMatch) return res.status(400).json({ msg: "Password is not match" })

                const refresh_token = createRefreshToken({ id: user._id })
                console.log(refresh_token, "Alhaja Java")
                res.cookie('refreshtoken', refresh_token, {
                    httpOnly: true,
                    path: '/user/refresh_token',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                    // 7days
                })
                res.json({ msg: "Login Success" })

            } else {
                const newUser = new Users({
                    name, email, password: passwordHash, avatar: picture
                })
                await newUser.save()
                const refresh_token = createRefreshToken({ id: newUser._id })
                console.log(refresh_token, "Alhaja Java")
                res.cookie('refreshtoken', refresh_token, {
                    httpOnly: true,
                    path: '/user/refresh_token',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                    // 7days
                })
                res.json({ msg: "Login Success" })
            }

        } catch (err) {
            console.log(err, "Life is good")
            return res.status(500).json({ msg: err.message })
        }
    }

}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, { expiresIn: '5m' })
}
const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}
const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
}

module.exports = userControl