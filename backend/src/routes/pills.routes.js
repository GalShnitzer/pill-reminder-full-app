const express = require('express');
const Joi = require('joi');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  getPills,
  createPill,
  updatePill,
  deletePill,
  takePill,
  untakePill,
  getPillHistory,
} = require('../controllers/pills.controller');

const hourPattern = Joi.string().pattern(/^\d{2}:\d{2}$/);

const hexColor = Joi.string().pattern(/^#[0-9a-fA-F]{6}$/);

const createPillSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  reminderHours: Joi.array().items(hourPattern).min(1).required(),
  emailStartHour: hourPattern.optional(),
  emailFrequencyMinutes: Joi.number().min(15).max(1440).optional(),
  emailEndHour: hourPattern.optional(),
  color: hexColor.optional(),
});

const updatePillSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  reminderHours: Joi.array().items(hourPattern).min(1),
  emailStartHour: hourPattern,
  emailFrequencyMinutes: Joi.number().min(15).max(1440),
  emailEndHour: hourPattern,
  isActive: Joi.boolean(),
  color: hexColor,
}).min(1);

router.use(authMiddleware);

router.get('/', getPills);
router.post('/', validate(createPillSchema), createPill);
router.patch('/:id', validate(updatePillSchema), updatePill);
router.delete('/:id', deletePill);
router.post('/:id/take', takePill);
router.delete('/:id/take', untakePill);
router.get('/:id/history', getPillHistory);

module.exports = router;
