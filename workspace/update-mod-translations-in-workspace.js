const path = require('path')
// const YAML = require('yaml')
const fs = require('mz/fs')
const vfs = require('vinyl-fs')
const through = require('through2')
// const rename = require('gulp-rename')
const argv = require('yargs')
  .usage('$0 -t <target_mod_name>')
  .alias('t', 'target')
  .argv;

const { target } = argv;
const dir = __dirname;
const dirTranlated = path.join(dir, '../mod/modchina');
const dirSource = path.join(dir, 'english');
const dirDest = path.join(dir, 'chinese');

function syParseAsObject(content) {
  const result = {};
  syReplaceKeyValuePair(content, function(key, value) {
    result[key] = value;
  })
  return result;
}

function syReplaceKeyValuePair(content, replacer) {
  const contentStr = content.toString();
  return contentStr.replace(/([\w\.]+):(\d)+\s+"(.+)"/gi, function (_, key, d, value) {
    return `${key}:${d} "${replacer(key, value)}"`;
  });
}

vfs.src(
    path.join(dirSource, target, 'localisation/*_english.yml')
  )
  .pipe(through.obj(async (file, _, next) => {
    // 合并最新的mod文本文件和已经翻译的文本文件.
    const filepath = file.path;
    const filedir = path.dirname(filepath);
    const basename = path.basename(filepath);

    const basenameChinese = basename.replace(/_english\.yml$/gi, '_simp_chinese.yml');

    const filepathTranlated = path.join(dirTranlated, 'localisation', basenameChinese);

    const isExists = await fs.exists(filepathTranlated);

    if (!isExists) {
      // 如果是新文件，则直接重命名复制
      return next();
    }

    const currentContent = await fs.readFile(filepathTranlated);
    const keyMap = syParseAsObject(currentContent);
    const newContent = syReplaceKeyValuePair(file.contents, (key, value) => {
      return keyMap[key] || value;
    }).replace(/^l_english/, 'l_simp_chinese');
    
    file.contents = Buffer.from(newContent);
    file.path = path.join(filedir, basenameChinese);
    next(null, file);
  }))
  .pipe(vfs.dest(path.join(dirDest, target, 'localisation')))

