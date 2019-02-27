const path = require('path')
// const YAML = require('yaml')
const fs = require('mz/fs')
const vfs = require('vinyl-fs')
const through = require('through2')
// const convertEncoding = require('gulp-convert-encoding');
// const rename = require('gulp-rename')
const argv = require('yargs')/* (['--help']) */
  .usage(`
$0 -t <target_mod_name>
or
npm run update-mod-trans-from-src -- -t <target_mod_name>
`)
  .alias('t', 'target')
  // .alias('r', 'relativePath')
  .argv;

;(function () {
const { target } = argv;
if (!target) return;

const dir = __dirname;
const dirTranlated = path.join(dir, '../mod/modchina');
const dirSource = path.join(dir, 'src');
const dirDest = path.join(dir, 'dist');

function syParseAsObject(content) {
  const result = {};
  syReplaceKeyValuePair(content, function(key, value) {
    result[key] = value;
  })
  return result;
}

function syReplaceKeyValuePair(content, replacer) {
  const contentStr = content.toString();
  return contentStr.replace(/([\w\.]+)(:\d*)?\s+"(.+)"/gi, function (_, key, suffix, value) {
    return `${key}${suffix} "${replacer(key, value)}"`;
  });
}

const dirSourceLocalisation = path.join(dirSource, target, 'localisation');

vfs.src(
    path.join(dirSourceLocalisation, '*/*_english.yml'),
    { removeBOM: false }
  )
  .pipe(through.obj(async (file, _, next) => {
    // 合并最新的mod文本文件和已经翻译的文本文件.
    const filepath = file.path;
    const filedir = path.dirname(filepath);
    const basename = path.basename(filepath);
    const relativePathFromLocalisation = path.dirname(path.relative(dirSourceLocalisation, filepath));

    const relativePathFromLocalisationArr = relativePathFromLocalisation.split('/');

    const isScoped = relativePathFromLocalisationArr[0] === 'english';

    const basenameChinese = basename.replace(/_english\.yml$/gi, '_simp_chinese.yml');

    const filepathTranslated = path.join(
      dirTranlated, 'localisation', basenameChinese
    );

    const filepathScopedTranslated = path.join(
      dirTranlated, 'localisation/simp_chinese', basenameChinese
    );

    const isScopedExists = await fs.exists(filepathScopedTranslated);

    const isExists = await fs.exists(filepathTranslated);

    if (!isScopedExists && !isExists) {
      // 如果是新文件，则直接重命名复制
      return next();
    }

    const lastTranslatedContent = await fs.readFile(
      isScopedExists ? filepathScopedTranslated : filepathTranslated
    );

    const keyMap = syParseAsObject(lastTranslatedContent);
    const newContent = syReplaceKeyValuePair(file.contents, (key, value) => {
      return keyMap[key] || value;
    }).replace(/l_english:/, 'l_simp_chinese:');

    let newRelativePathFromLocalisation = ''
    if (isScoped) {
      const dirs = [...relativePathFromLocalisationArr];
      dirs[0] = 'simp_chinese';
      newRelativePathFromLocalisation = dirs.join('/');
    }
    
    file.contents = Buffer.from(newContent);
    file.path = path.join(
      dirSourceLocalisation, newRelativePathFromLocalisation, basenameChinese
    );
    // console.log(newRelativePathFromLocalisation)
    next(null, file); 
    // next();
  }))
  // .pipe(convertEncoding({to: 'utf8', iconv: { addBOM: true }}))
  .pipe(vfs.dest(path.join(dirDest, target, 'localisation')));
})();
