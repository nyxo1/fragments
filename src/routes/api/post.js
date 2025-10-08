// src/routes/api/post.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    // rawBody() middleware already validated Content-Type
    // If req.body isn't a Buffer, type wasn't supported
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Unsupported media type');
      return res.status(415).json({
        status: 'error',
        error: { code: 415, message: 'Unsupported Media Type' },
      });
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

    return res
      .status(201)
      .location(location)
      .json({
        status: 'ok',
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      });
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    return res.status(500).json({
      status: 'error',
      error: { code: 500, message: 'Internal Server Error' },
    });
  }
};
