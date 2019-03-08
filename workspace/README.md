# 模组更新翻译新词组流程

0. 需要安装最新版本的node.js(11.x以上)

1. 把最新的模组文本文件放到`./workspace/src/<模组目录名>/localisation`当中。

2. 执行`node ./workspace/update-mod-translations-from-src -t <模组目录名>`
   该脚本会自动读取`<模组目录名>/localisation`和`modchina/localisation`同名的词组文件, 并且合并新旧的文件（同样键值的会使用`modchina`中已经翻译的文本,缺失键值的会直接使用英文文本）

3. 到`./workspace/dist/<模组目录名>/localisation`中查看合并后的文件，翻译未翻译的词组，如果mod更新改动较大，建议对已翻译的文本进行必要的校对。

3.1 执行`node ./workspace/create-dist-patch -t <模组目录名1> <模组目录名2> <模组目录名...>`, 会在`mod/patches`目录下生成对应的增量布丁包。可以直接把补丁包发给作者。

4. 把最终翻译好的文件提交给`!!!CN!!! MOD CHINESE`的作者。
