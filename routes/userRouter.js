const router = require('express').Router()
const { genSalt } = require('bcrypt')
const userControl = require('../controllers/userControl')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')


router.post("/register", userControl.register)

router.post("/activation", userControl.activateEmail)

router.post("/login", userControl.login)

router.post("/refresh_token", userControl.getAccessToken)

router.post("/forgot", userControl.forgotPassword)

router.post("/reset", auth, userControl.resetPassword)

router.get("/infor", auth, userControl.getUserInfor)

router.get("/all_infor", auth, authAdmin, userControl.getUsersAllInfor)

router.post("/logout", userControl.logout)

router.patch("/update", auth, userControl.updateUser)

router.patch("/update_role/:id", auth, authAdmin, userControl.updateUsersRole)

router.delete("/delete/:id", auth, authAdmin, userControl.deleteUser)

// router.post("/register", async(req,res)=>{
//     try{
//         //generate password
//         const salt = await bcrypt.genSalt(10)
//         const hashedPassword = await bcrypt.hash(req.body.password, salt)
//         //create user

//         const newUser = new User({
//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword
//         })
//        // save user and return response

//        const savedUser = await newUser.save()
//        res.status(200).json(user)
//     }catch(err){
//         res.status(500).json(err)
//     }
// })

module.exports = router