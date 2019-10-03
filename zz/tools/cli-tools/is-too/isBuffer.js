/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

 function isBuffer (obj) {
  return obj != null && obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}



export function isWindows() {
  return process && (process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE));
};

function uncPathRegex() {
return /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/;
};

function isUncPath(filepath) {
if (typeof filepath !== 'string') {
  throw new TypeError('expected a string');
}
return uncPathRegex().test(filepath);
};

function isRelative(filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('expected filepath to be a string');
  }
  // Windows UNC paths are always considered to be absolute.
  return !isUncPath(filepath) && !/^([a-z]:)?[\\\/]/i.test(filepath);
};
