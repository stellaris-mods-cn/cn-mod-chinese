const path = require('path')
const vfs = require('vinyl-fs')
const yargs = require('yargs');
const mergeStream = require('merge-stream')

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
    console.log('argv.targets', t, base)
    return vfs.src(
      path.join(base, 'localisation/**/*.yml'), {
        base
      })
  }))
    .pipe(vfs.dest(path.join(dirToDist, `modchina-patch-${now}`)));

})();