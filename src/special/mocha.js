import fs from 'fs';
import path from 'path';
import lodash from 'lodash';
import requirePackageName from 'require-package-name';
import getScripts from '../utils/get-scripts';

function getOpts(script) {
  const argvs = script.split(' ').filter(argv => argv);
  const optsIndex = argvs.indexOf('--opts');
  return optsIndex !== -1 ? argvs[optsIndex + 1] : null;
}

function getRequires(content, deps) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.indexOf('--require ') === 0)
    .map(line => line.substring('--require '.length).trim())
    .map(requirePackageName)
    .filter(name => deps.indexOf(name) !== -1);
}

export default function parseMocha(content, filepath, deps, rootDir) {
  const defaultOptPath = path.resolve(rootDir, 'test/mocha.opts');
  if (filepath === defaultOptPath) {
    return getRequires(content, deps);
  }

  // get mocha.opts from scripts
  const requires = lodash(getScripts(filepath, content))
    .filter(script => script.indexOf('mocha') !== -1)
    .map(script => getOpts(script))
    .filter(opts => opts)
    .map(opts => path.resolve(filepath, '..', opts))
    .map(optPath => fs.readFileSync(optPath, 'utf-8')) // TODO async read file
    .map(optContent => getRequires(optContent, deps))
    .flatten()
    .value();

  return requires;
}
