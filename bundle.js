const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default; // 添加default转为es 6形式
const babel  = require('@babel/core');

const moduleAnalyser = ( filename ) => {
    // 读取filename中的内容
    const content = fs.readFileSync(filename, 'utf-8');
    // 可通过paser将查看到的文件内容翻译为抽象语法树
    const ast = parser.parse(content, {
        sourceType:'module'
    });
    const dependencies = {};
    // 对抽象语法树进行遍历，抽取所有import信息,对依赖文件进行分析，生成依赖关系
    traverse(ast,{
        ImportDeclaration({ node }){
            const dirname = path.dirname(filename);
            // 将相对路径改为绝对路径
            const newFile = './' + path.join(dirname,node.source.value);
            dependencies[node.source.value] = newFile;
        }
    });
    // 将原始代码转化为浏览器可识别的代码，用到babel/core
    // console.log(dependencies);
    const { code } = babel.transformFromAst(ast,null,{
        presets:["@babel/preset-env"]
    });
    // console.log(code);
    return {
        filename,
        dependencies,
        code
    }
}

const makeDependenciesGraph = (entry) => {
    const entryModule = moduleAnalyser(entry);
    const graphArry = [ entryModule ];
    for(let i=0;i<graphArry.length;i++){
        const item = graphArry[i];
        const { dependencies } = item;
        if(dependencies){
            for(let j in dependencies){
                graphArry.push(moduleAnalyser(dependencies[j]));
            }
        }
    }

    const graph = {};
    graphArry.forEach(item => {
        graph[item.filename] = {
            dependencies: item.dependencies,
            code: item.code
        }
    })
    return graph;
}

const generateCode = (entry) => {
    const graph = JSON.stringify(makeDependenciesGraph(entry));
    return `
        (function(graph){
            function require(module){
                // 相对路径转为绝对路径
                function localRequire(relativePath){
                    return require(graph[module].dependencies[relativePath]);
                }
                var exports = {};
                (function(require,exports,code){
                    eval(code);
                })(localRequire,exports,graph[module].code);
                console.log(exports);
                return exports;
            };
            require('${entry}')
        })(${graph});
    `;
}
// const moduleInfo = moduleAnalyser('./src/index.js');
// console.log(moduleInfo);
// const graphInfo = makeDependenciesGraph('./src/index.js');
// console.log(graphInfo);
const code = generateCode('./src/index.js');
console.log(code);