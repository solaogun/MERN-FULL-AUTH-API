const router = require('express').Router()
const uploadImage = require('../middleware/uploadImage')
const uploadControl = require('../controllers/uploadControl')

router.post('/upload_avatar', uploadImage, uploadControl.uploadAvatar)

module.exports = router