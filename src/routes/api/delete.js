// src/routes/api/delete.js

const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  const { id } = req.params;

  try {
    logger.debug({ id, ownerId: req.user }, 'Deleting fragment by id');

    // First verify the fragment exists
    await Fragment.byId(req.user, id);

    // Then delete it
    await Fragment.delete(req.user, id);

    logger.info({ id, ownerId: req.user }, 'Deleted fragment successfully');

    return res
      .status(200)
      .json(createSuccessResponse({ message: 'fragment deleted successfully' }));
  } catch (err) {
    // Check if it's a "not found" error
    if (err.message && err.message.includes('not found')) {
      logger.warn({ err, id }, 'Fragment not found for deletion');
      return res.status(404).json(createErrorResponse(404, 'fragment not found'));
    }

    // Otherwise it's a server error (S3/DynamoDB issue)
    logger.error({ err, id }, 'Error deleting fragment');
    return res.status(500).json(createErrorResponse(500, 'unable to delete fragment'));
  }
};
