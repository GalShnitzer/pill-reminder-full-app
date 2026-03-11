const express = require('express');
const Joi = require('joi');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { getProfile, updateProfile, saveResendKey, deleteResendKey, sendTestEmail, getVapidPublicKey, subscribePush, unsubscribePush } = require('../controllers/users.controller');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  phone: Joi.string().allow('').optional(),
  timezone: Joi.string().optional(),
}).min(1);

const resendKeySchema = Joi.object({
  apiKey: Joi.string().required(),
});

const pushSubSchema = Joi.object({
  endpoint: Joi.string().uri().required(),
  p256dh: Joi.string().required(),
  auth: Joi.string().required(),
});

const unsubSchema = Joi.object({
  endpoint: Joi.string().uri().required(),
});

router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.put('/resend-key', validate(resendKeySchema), saveResendKey);
router.delete('/resend-key', deleteResendKey);
router.post('/test-email', sendTestEmail);
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/push-subscription', validate(pushSubSchema), subscribePush);
router.delete('/push-subscription', validate(unsubSchema), unsubscribePush);

module.exports = router;
