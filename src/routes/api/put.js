// src/routes/api/put.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const newContentType = req.get('Content-Type');

    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Unsupported media type');
      return res.status(415).json(createErrorResponse(415, 'unsupported media type'));
    }

    logger.debug({ id, ownerId: req.user, newContentType }, 'Updating fragment');

    // Get existing fragment
    const fragment = await Fragment.byId(req.user, id);

    // Check if the new type is in the allowed conversion formats
    if (!fragment.formats.includes(newContentType)) {
      logger.warn(
        {
          existingType: fragment.type,
          newType: newContentType,
          allowedFormats: fragment.formats,
        },
        'Invalid type conversion'
      );
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            `Cannot convert ${fragment.type} to ${newContentType}. Allowed formats: ${fragment.formats.join(', ')}`
          )
        );
    }

    // Update the fragment type and data
    fragment.type = newContentType;
    await fragment.setData(req.body);

    logger.info(
      { id, ownerId: req.user, newType: newContentType },
      'Fragment updated with conversion'
    );

    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    if (err.message.includes('not found')) {
      logger.warn({ err, id: req.params.id }, 'Fragment not found for update');
      return res.status(404).json(createErrorResponse(404, 'fragment not found'));
    }
    logger.error({ err }, 'Error updating fragment');
    return res.status(500).json(createErrorResponse(500, 'unable to update fragment'));
  }
};
