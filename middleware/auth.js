const jwt = require('jsonwebtoken')


const auth = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        console.log("Token:", token);
        if (!token) return res.status(400).json({ msg: "Invalid Authentication" })

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // console.log(err, "HELLO WORLD")
            if (err) return res.status(400).json({ msg: "Invalid Authentication 2" })

            req.user = user
            next()
        })
    } catch (err) {
        res.status(500).json({ msg: err.message })
    }
}

module.exports = auth