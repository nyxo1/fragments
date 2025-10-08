// src/routes/api/get.js
const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const expand = req.query.expand === '1';
    logger.debug({ ownerId: req.user, expand }, 'Getting fragments for user');

    const fragments = await Fragment.byUser(req.user, expand);

    logger.info({ ownerId: req.user, count: fragments.length }, 'Retrieved fragments');

    res.status(200).json(
      createSuccessResponse({
        fragments,
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragments');
    res.status(500).json({
      status: 'error',
      error: { code: 500, message: 'Internal Server Error' },
    });
  }
};
