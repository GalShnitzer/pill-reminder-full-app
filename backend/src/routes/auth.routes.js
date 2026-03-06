const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { googleSignIn, getMe, signOut } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const googleSignInSchema = Joi.object({
  idToken: Joi.string().required(),
  phone: Joi.string().allow('').optional(),
  timezone: Joi.string().allow('').optional(),
});

router.post('/google', validate(googleSignInSchema), googleSignIn);
router.get('/me', authMiddleware, getMe);
router.post('/signout', authMiddleware, signOut);

module.exports = router;
