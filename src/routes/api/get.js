// src/routes/api/get.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

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
    res.status(500).json(createErrorResponse(500, 'unable to retrieve fragments'));
  }
};
