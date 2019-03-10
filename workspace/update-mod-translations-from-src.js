const path = require('path')
// const YAML = require('yaml')
const fs = require('mz/fs')
const vfs = require('vinyl-fs')
const chalk = require('chalk')
const log = require('fancy-log')
const through = require('through2')
// const convertEncoding = require('gulp-convert-encoding');
// const rename = require('gulp-rename')
const yargs = require('yargs');
const helpMessage = `
usage:
$0 -t <target_mod_name>
or
npm run update-mod-trans-from-src -- -t <target_mod_name>
`
const argv = yargs/* (['--help']) */
  .usage(helpMessage).help()
  .alias('t', 'target')
  // .alias('r', 'relativePath')
  .argv;

;(function () {
const { target } = argv;
if (!target) return yargs(['--help']).usage(helpMessage).help().argv;

const dir = __dirname;
const dirTranlated = path.join(dir, '../mod/modchina');
const dirSource = path.join(dir, 'src');
const dirDest = path.join(dir, 'dist');

function syParseAsObject(content) {
  const result = {};
  syReplaceKeyValuePair(content, function(_, key, value) {
    result[key] = value;
  })
  return result;
}

function syReplaceKeyValuePair(content, replacer) {
  const contentStr = content.toString();
  return contentStr.replace(/([\w\.]+)(:\d*)?\s?"(.+)"/gi, function (_, key, suffix, value) {
    const wrap = final => `${key}${suffix} "${final}"`
    return replacer(wrap, key, value);
  });
}

const dirSourceLocalisation = path.join(dirSource, target, 'localisation');

log('reading...', `${chalk.bold(target)}/localisation/*/*_english.yml`);

vfs.src(
    path.join(dirSourceLocalisation, '**/*_english.yml'),
    { removeBOM: false }
  )
  .pipe(through.obj(async (file, _, next) => {
    // 合并最新的mod文本文件和已经翻译的文本文件.
    const filepath = file.path;
    const filedir = path.dirname(filepath);
    const basename = path.basename(filepath);
    const relativeFilePathFromLocalisation = path.relative(dirSourceLocalisation, filepath);
    const relativeDirPathFromLocalisation = path.dirname(
      relativeFilePathFromLocalisation
    );

    const relativeDirPathFromLocalisationArr = relativeDirPathFromLocalisation.split('/');

    const isScoped = relativeDirPathFromLocalisationArr[0] === 'english';

    const basenameChinese = basename.replace(/_english\.yml$/gi, '_simp_chinese.yml');

    const filepathTranslated = path.join(
      dirTranlated, 'localisation', relativeDirPathFromLocalisation, basenameChinese
    );

    const filepathScopedTranslated = path.join(
      dirTranlated, 'localisation/simp_chinese', basenameChinese
    );

    const isScopedExists = await fs.exists(filepathScopedTranslated);

    const isExists = await fs.exists(filepathTranslated);

    let newRelativeDirPathFromLocalisation = ''
    if (isScoped) {
      const dirs = [...relativeDirPathFromLocalisationArr];
      dirs[0] = 'simp_chinese';
      newRelativeDirPathFromLocalisation = dirs.join('/');
    }
    file.path = path.join(
      dirSourceLocalisation, newRelativeDirPathFromLocalisation, basenameChinese
    );

    let keyMap = {};

    if (isScopedExists) {
      const content = await fs.readFile(filepathScopedTranslated);
      keyMap = syParseAsObject(content);
    }

    if (isExists) {
      const content = await fs.readFile(filepathTranslated);
      keyMap = syParseAsObject(content);
    }

    const newContent = syReplaceKeyValuePair(
      file.contents, (wrap, key, value) => {
        const translated = keyMap[key]
        return wrap(translated || value)+"\n"+
        `## ${key} -> ${value} ##`
      }).replace(/l_english:/, 'l_simp_chinese:');
    
    file.contents = Buffer.from(newContent);

    if (!isScopedExists && !isExists) {
      // 如果是新文件，则直接重命名复制
      log(
        chalk.green.bold('new'), 
        'from', 
        chalkBaseName(relativeFilePathFromLocalisation)
      );
    } else {
      log(
        chalk.blue.bold('merged'), 
        'from', 
        chalkBaseName(relativeFilePathFromLocalisation)
      );
    }
    
    next(null, file);
  }))
  .pipe(through.obj((file, _, next) => {
    next(null, file);
  }))
  // .pipe(convertEncoding({to: 'utf8', iconv: { addBOM: true }}))
  .pipe(vfs.dest(path.join(dirDest, target, 'localisation')))
  .on('end', _ => log(chalk.green.bold('done~')))
  .on('error', log.error);

})();

function chalkBaseName(fielpath, wrapBaseName = a => chalk.bold(a)) {
  const baseName = path.basename(fielpath);
  const dirName = path.dirname(fielpath);
  return `${dirName}/${wrapBaseName(baseName)}`;
}
