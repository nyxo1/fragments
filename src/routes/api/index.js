const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const router = express.Router();

logger.debug('Initializing /v1 API routes');

router.get('/fragments', require('./get'));

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        const supported = Fragment.isSupportedType(type);
        logger.debug({ type, supported }, 'Parsing Content-Type for raw body');
        return supported;
      } catch (err) {
        logger.warn({ err }, 'Failed to parse Content-Type');
        return false;
      }
    },
  });

logger.info('Registering POST /v1/fragments route');
router.post('/fragments', rawBody(), require('./post'));

// Add GET by ID route
router.get('/fragments/:id', require('./get-by-id'));

module.exports = router;
