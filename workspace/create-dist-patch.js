const path = require('path')
const vfs = require('vinyl-fs')
const yargs = require('yargs');
const mergeStream = require('merge-stream')
const log = require('fancy-log')
const chalk = require('chalk')
const through = require('through2')

const argv = yargs /* (['--help']) */
  .alias('t', 'targets')
  .array('targets')
  .argv;

;
(function () {

  const dir = __dirname;
  const dirWorkspaceDist = path.join(dir, './dist');
  const dirToDist = path.join(dir, '../mod/patches');

  
  const now = Date.now();

  mergeStream(...argv.targets.map(t => {
    const base = path.join(dirWorkspaceDist, t);
    let isFirst = true;
    return vfs.src(
      path.join(base, 'localisation/**/*.yml'), {
        base
      }).pipe(through.obj((f, _, next) => {
        isFirst = false;
        log(`file of ${chalk.blue.bold(t)}`, chalk.bold(path.relative(base, f.path)));
        return next(null, f);
      }))
  }))
    .pipe(vfs.dest(path.join(dirToDist, `modchina-patch-${now}`)));

})();