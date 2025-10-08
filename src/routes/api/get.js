/**
 * Get a list of fragments for the current user
 */

// adding response module to get HTTP response structure
const { createSuccessResponse } = require('../../response');

module.exports = (req, res) => {
  res.status(200).json(
    createSuccessResponse({
      fragments: [],
    })
  );
};
