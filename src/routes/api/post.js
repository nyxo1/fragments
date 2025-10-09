// src/routes/api/post.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  try {
    // rawBody() middleware already validated Content-Type
    // If req.body isn't a Buffer, type wasn't supported
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Unsupported media type');
      return res.status(415).json(createErrorResponse(415, 'unsupported media type'));
    }

    const fragment = new Fragment({
      ownerId: req.user,
      type: req.get('Content-Type'),
    });

    await fragment.save();
    await fragment.setData(req.body);

    const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    logger.info({ id: fragment.id }, 'Fragment created');

    return res.status(201).location(location).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    return res.status(500).json(createErrorResponse(500, 'unable to create fragment'));
  }
};
