const express = require('express');
const Joi = require('joi');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { getProfile, updateProfile, saveResendKey, deleteResendKey } = require('../controllers/users.controller');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  phone: Joi.string().allow('').optional(),
  timezone: Joi.string().optional(),
}).min(1);

const resendKeySchema = Joi.object({
  apiKey: Joi.string().required(),
});

router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.put('/resend-key', validate(resendKeySchema), saveResendKey);
router.delete('/resend-key', deleteResendKey);

module.exports = router;
