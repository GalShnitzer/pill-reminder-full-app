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

const scheduleFields = {
  scheduleType: Joi.string().valid('daily', 'every_n_days', 'weekly', 'monthly'),
  scheduleInterval: Joi.number().integer().min(1).max(365),
  scheduleWeekdays: Joi.array().items(Joi.number().integer().min(0).max(6)),
  scheduleMonthDay: Joi.number().integer().min(1).max(31),
  scheduleStartDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(''),
  reminderChannels: Joi.array().items(Joi.string().valid('email', 'sms')).min(1).optional(),
};

const createPillSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  reminderHours: Joi.array().items(hourPattern).min(1).required(),
  emailStartHour: hourPattern.optional(),
  emailFrequencyMinutes: Joi.number().min(15).max(1440).optional(),
  emailEndHour: hourPattern.optional(),
  color: hexColor.optional(),
  ...scheduleFields,
});

const updatePillSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  reminderHours: Joi.array().items(hourPattern).min(1),
  emailStartHour: hourPattern,
  emailFrequencyMinutes: Joi.number().min(15).max(1440),
  emailEndHour: hourPattern,
  isActive: Joi.boolean(),
  color: hexColor,
  ...scheduleFields,
}).min(1);

const takePillSchema = Joi.object({
  scheduledHour: hourPattern.optional(),
});

router.use(authMiddleware);

router.get('/', getPills);
router.post('/', validate(createPillSchema), createPill);
router.patch('/:id', validate(updatePillSchema), updatePill);
router.delete('/:id', deletePill);
router.post('/:id/take', validate(takePillSchema), takePill);
router.delete('/:id/take', untakePill);
router.get('/:id/history', getPillHistory);

module.exports = router;
