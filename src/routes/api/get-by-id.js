// src/routes/api/get-by-id.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug({ id, ownerId: req.user }, 'Getting fragment by id');

    const fragment = await Fragment.byId(req.user, id);
    const data = await fragment.getData();

    logger.info({ id, ownerId: req.user, type: fragment.type }, 'Retrieved fragment data');

    res.status(200).type(fragment.type).send(data);
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    res.status(404).json(createErrorResponse(404, 'fragment not found'));
  }
};
