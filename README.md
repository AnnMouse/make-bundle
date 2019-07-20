- babel/parser 将查看到的文件内容翻译为抽象语法树
- @babel/traverse 查找抽象语法树中所有文件的依赖关系
- 打包过程中既需要相对路径，也需要绝对路径，用join关联路径
- @babel/core 将抽象语法树转为浏览器可执行的代码
- 使用递归函数获取所有文件的依赖树

以上消息来自 www.dell-lee.com