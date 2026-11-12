/**
 * Utility functions for dealing with files and file descriptors.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { createWriteStream, readFile, writeFile } = require('node:fs');
const { promisify } = require('node:util');

/**
 * Promise wrapper for fs.readFile with support for file descriptors.
 *
 * @param {string|!Buffer|!URL|number} filePathOrDesc Path of file to read,
 * or file descriptor to read.
 * @param {string|object=} options Encoding or options.
 * @returns {!Promise<string|!Buffer>} Promise with data read.
 */
exports.readFile = promisify(readFile);

/**
 * Promise wrapper for fs.writeFile with fixes for file descriptors.
 *
 * @param {string|!Buffer|!URL|number} filePathOrDesc Path of file to write,
 * or file descriptor to write.
 * @param {string|!Buffer} data Data to write to file.
 * @param {string|object=} options Encoding or options.
 * @returns {!Promise} Promise of completion.
 */
exports.writeFile = function writeFilePromise(filePathOrDesc, data, options) {
  return new Promise((resolve, reject) => {
    // Before nodejs/node#23709, fs.writeFile would seek FD.
    // Both fs.writeFile and fs.createWriteStream on stdout/stderr FDs can
    // result in truncation due to lack of flush before exit (see
    // nodejs/node#6379, nodejs/node#6456, and many others).
    // Use process.stdout/stderr which work reliably.
    if (filePathOrDesc === 1) {
      process.stdout
        .once('error', reject)
        .write(data, resolve);
    } else if (filePathOrDesc === 2) {
      process.stderr
        .once('error', reject)
        .write(data, resolve);
    } else if (typeof filePathOrDesc === 'number') {
      createWriteStream(
        undefined,
        {
          fd: filePathOrDesc,
          encoding: options && options.encoding,
        },
      )
        .once('error', reject)
        .end(data, resolve);
    } else {
      writeFile(
        filePathOrDesc,
        data,
        options,
        (err) => (err ? reject(err) : resolve()),
      );
    }
  });
};
