// src/routes/api/get-by-id.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse } = require('../../response');

const path = require('path');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ id, ownerId: req.user }, 'Getting fragment by id');

    // Check if the request has an extension (like .html)
    const ext = path.extname(id);
    const fragmentId = ext ? id.slice(0, -ext.length) : id;

    const fragment = await Fragment.byId(req.user, fragmentId);
    const data = await fragment.getData();

    // If no extension, return the raw data
    if (!ext) {
      logger.info(
        { id: fragmentId, ownerId: req.user, type: fragment.type },
        'Retrieved fragment data'
      );
      return res.status(200).type(fragment.type).send(data);
    }

    // Handle conversion from markdown to HTML
    if (ext === '.html' && fragment.mimeType === 'text/markdown') {
      const htmlContent = md.render(data.toString());
      logger.info(
        { id: fragmentId, ownerId: req.user, type: 'text/html' },
        'Retrieved fragment data as HTML'
      );
      return res.status(200).type('text/html').send(htmlContent);
    }

    //Unsupported extension or conversion
    logger.warn({ ext, id }, 'Unsupported extension or conversion');
    return res.status(415).json(createErrorResponse(415, 'unsupported media type or conversion'));
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    res.status(404).json(createErrorResponse(404, 'fragment not found'));
  }
};
