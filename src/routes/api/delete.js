// src/routes/api/delete.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ id, ownerId: req.user }, 'Deleting fragment by id');

    await Fragment.byId(req.user, id);
    await Fragment.delete(req.user, id);

    logger.info({ id, ownerId: req.user }, 'Deleted fragment');

    return res
      .status(200)
      .json(createSuccessResponse({ message: 'fragment deleted successfully' }));
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found for deletion');
    return res.status(404).json(createErrorResponse(404, 'fragment not found'));
  }
};
