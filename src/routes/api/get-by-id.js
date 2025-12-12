// src/routes/api/get-by-id.js
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse } = require('../../response');

const path = require('path');
const MarkdownIt = require('markdown-it');
const sharp = require('sharp');
const yaml = require('js-yaml');
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

    // Determine the target format from extension
    const targetType = getTypeFromExtension(ext);

    if (!targetType) {
      logger.warn({ ext, id }, 'Unknown extension');
      return res.status(415).json(createErrorResponse(415, 'unsupported media type or conversion'));
    }

    // Check if conversion is supported
    if (!fragment.formats.includes(targetType)) {
      logger.warn({ ext, id, from: fragment.type, to: targetType }, 'Unsupported conversion');
      return res.status(415).json(createErrorResponse(415, 'unsupported media type or conversion'));
    }

    // Handle text conversions (text/*, application/json, application/yaml)
    if (
      fragment.isText ||
      fragment.mimeType === 'application/json' ||
      fragment.mimeType === 'application/yaml'
    ) {
      const converted = await convertText(fragment, data, targetType);
      logger.info(
        { id: fragmentId, ownerId: req.user, type: targetType },
        'Retrieved converted fragment'
      );
      return res.status(200).type(targetType).send(converted);
    }

    // Handle image conversions
    if (fragment.isImage) {
      const converted = await convertImage(data, targetType);
      logger.info(
        { id: fragmentId, ownerId: req.user, type: targetType },
        'Retrieved converted image'
      );
      return res.status(200).type(targetType).send(converted);
    }

    // Unsupported conversion
    logger.warn({ ext, id }, 'Unsupported conversion');
    return res.status(415).json(createErrorResponse(415, 'unsupported media type or conversion'));
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    res.status(404).json(createErrorResponse(404, 'fragment not found'));
  }
};

function getTypeFromExtension(ext) {
  const typeMap = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.yaml': 'application/yaml',
    '.yml': 'application/yaml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
  };
  return typeMap[ext.toLowerCase()];
}

async function convertText(fragment, data, targetType) {
  const text = data.toString();
  const sourceType = fragment.mimeType;

  // If same type, return original
  if (sourceType === targetType) {
    return data;
  }

  // Markdown to HTML
  if (sourceType === 'text/markdown' && targetType === 'text/html') {
    return md.render(text);
  }

  // Markdown to plain text - render to HTML first, then strip tags
  if (sourceType === 'text/markdown' && targetType === 'text/plain') {
    const html = md.render(text);
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // JSON to YAML
  if (sourceType === 'application/json' && targetType === 'application/yaml') {
    const obj = JSON.parse(text);
    return yaml.dump(obj);
  }

  // CSV to JSON
  if (sourceType === 'text/csv' && targetType === 'application/json') {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index] ? values[index].trim() : '';
      });
      result.push(obj);
    }

    return JSON.stringify(result, null, 2);
  }

  // HTML to plain text - strip all HTML tags
  if (sourceType === 'text/html' && targetType === 'text/plain') {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  // CSV to plain text - just return as is
  if (sourceType === 'text/csv' && targetType === 'text/plain') {
    return text;
  }

  // Any other type to plain text (fallback)
  if (targetType === 'text/plain') {
    return text;
  }

  // If we get here, return original (shouldn't happen due to formats check)
  return data;
}

async function convertImage(data, targetType) {
  const formatMap = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  };

  const format = formatMap[targetType];
  if (!format) {
    throw new Error('Unsupported image format');
  }

  return await sharp(data).toFormat(format).toBuffer();
}
