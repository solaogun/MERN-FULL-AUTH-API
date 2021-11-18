const router = require('express').Router()
const uploadImage = require('../middleware/uploadImage')
const uploadControl = require('../controllers/uploadControl')
const auth = require('../middleware/auth')

router.post('/upload_avatar', uploadImage, auth, uploadControl.uploadAvatar)

module.exports = router