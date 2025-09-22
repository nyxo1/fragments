/**
 * Get a list of fragments for the current user
 */

// adding response module to get HTTP response structure
const { createSuccessResponse } = require('../../response');

module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json(
    createSuccessResponse({
      // TODO: change me
      fragments: [],
    })
  );
};
