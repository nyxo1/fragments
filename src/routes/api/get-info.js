// src/routes/api/get-info.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * Get a fragment's metadata by ID
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ id, ownerId: req.user }, 'Getting fragment info');

    const fragment = await Fragment.byId(req.user, id);

    logger.info({ id, ownerId: req.user, type: fragment.type }, 'Retrieved fragment metadata');

    res.status(200).json(
      createSuccessResponse({
        fragment: fragment,
      })
    );
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    res.status(404).json(createErrorResponse(404, 'fragment not found'));
  }
};
