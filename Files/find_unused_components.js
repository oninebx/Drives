import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

// 1. 获取传入的项目目录路径
const inputPath = process.argv[2] || '.';
const projectRoot = path.resolve(inputPath);

if (!fs.existsSync(projectRoot)) {
  console.error(`❌ 错误: 找不到指定路径 -> ${projectRoot}`);
  process.exit(1);
}

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// 路径解析工具：兼容直接文件与目录 index.ts/index.tsx 导出
function resolvePath(baseDir, importPath) {
  if (!importPath || !importPath.startsWith('.')) return null; // 排除 node_modules
  const absPath = path.resolve(baseDir, importPath);

  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) return absPath;

  for (const ext of EXTENSIONS) {
    if (fs.existsSync(absPath + ext)) return absPath + ext;
  }

  if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const indexPath = path.join(absPath, `index${ext}`);
      if (fs.existsSync(indexPath)) return indexPath;
    }
  }
  return null;
}

// 2. AST 文件分析：提取每个文件的 导出映射 (exports) 和 导入依赖 (imports)
const fileAnalysisMap = new Map();

function analyzeFile(filePath) {
  if (fileAnalysisMap.has(filePath)) return fileAnalysisMap.get(filePath);

  const code = fs.readFileSync(filePath, 'utf-8');
  const fileDir = path.dirname(filePath);

  const exports = new Map(); // exportName -> { sourceFile, originalSymbol }
  const wildcardReExports = new Set(); // export * from '...'
  const imports = []; // [{ targetFile, symbolName }]

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    });

    traverse(ast, {
      // 处理 import 声明
      ImportDeclaration({ node }) {
        const resolved = resolvePath(fileDir, node.source.value);
        if (!resolved) return;

        node.specifiers.forEach(spec => {
          if (spec.type === 'ImportDefaultSpecifier') {
            imports.push({ targetFile: resolved, symbolName: 'default' });
          } else if (spec.type === 'ImportSpecifier') {
            const importedName = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
            imports.push({ targetFile: resolved, symbolName: importedName });
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            imports.push({ targetFile: resolved, symbolName: '*' });
          }
        });
      },

      // 处理 export { x } 或 export { x } from './y'
      ExportNamedDeclaration({ node }) {
        const resolvedSource = node.source ? resolvePath(fileDir, node.source.value) : null;

        if (node.specifiers) {
          node.specifiers.forEach(spec => {
            if (spec.type === 'ExportSpecifier') {
              const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
              const localName = spec.local.name;

              if (resolvedSource) {
                // re-export: export { Button } from './Button'
                exports.set(exportedName, { sourceFile: resolvedSource, originalSymbol: localName });
              } else {
                // 本地导出: export { Button }
                exports.set(exportedName, { sourceFile: filePath, originalSymbol: localName });
              }
            }
          });
        }

        // 处理 export const Button = ... / export function Component() {}
        if (node.declaration) {
          const decl = node.declaration;
          if (decl.id && decl.id.name) {
            exports.set(decl.id.name, { sourceFile: filePath, originalSymbol: decl.id.name });
          } else if (decl.declarations) {
            decl.declarations.forEach(d => {
              if (d.id && d.id.name) {
                exports.set(d.id.name, { sourceFile: filePath, originalSymbol: d.id.name });
              }
            });
          }
        }
      },

      // 处理 export default
      ExportDefaultDeclaration() {
        exports.set('default', { sourceFile: filePath, originalSymbol: 'default' });
      },

      // 处理 export * from './Button' (Barrel Export)
      ExportAllDeclaration({ node }) {
        const resolved = resolvePath(fileDir, node.source.value);
        if (resolved) {
          if (node.exported) {
            // export * as Utils from './utils'
            const exportedName = node.exported.type === 'Identifier' ? node.exported.name : node.exported.value;
            exports.set(exportedName, { sourceFile: resolved, originalSymbol: '*' });
          } else {
            // export * from './Button'
            wildcardReExports.add(resolved);
          }
        }
      },

      // 兼容动态 import() 语法
      CallExpression({ node }) {
        if (node.callee.type === 'Import' && node.arguments[0]?.value) {
          const resolved = resolvePath(fileDir, node.arguments[0].value);
          if (resolved) imports.push({ targetFile: resolved, symbolName: '*' });
        }
      }
    });
  } catch (err) {
    // 遇到无法解析的非标准 TS 语法时妥善跳过
  }

  const result = { filePath, exports, wildcardReExports, imports };
  fileAnalysisMap.set(filePath, result);
  return result;
}

// 3. 符号级追踪引擎：递归穿透 index.ts 找到真实的定义文件 (.tsx)
const usedFiles = new Set();
const visitedSymbols = new Set();

function traceSymbol(filePath, symbolName) {
  const symbolKey = `${filePath}::${symbolName}`;
  if (visitedSymbols.has(symbolKey)) return;
  visitedSymbols.add(symbolKey);

  usedFiles.add(filePath);

  const fileData = analyzeFile(filePath);
  if (!fileData) return;

  // 如果是命名空间导入 (import * as X)，追踪目标文件的所有导出与依赖
  if (symbolName === '*') {
    fileData.imports.forEach(imp => traceSymbol(imp.targetFile, imp.symbolName));
    fileData.exports.forEach(exp => {
      if (exp.sourceFile) traceSymbol(exp.sourceFile, exp.originalSymbol);
    });
    fileData.wildcardReExports.forEach(reExportFile => traceSymbol(reExportFile, '*'));
    return;
  }

  // 情况 A: 在当前文件中找到直接或具名重导出
  if (fileData.exports.has(symbolName)) {
    const exp = fileData.exports.get(symbolName);
    if (exp.sourceFile === filePath) {
      // 在本地文件中定义：进一步追踪该文件内部引用的其他符号
      fileData.imports.forEach(imp => traceSymbol(imp.targetFile, imp.symbolName));
    } else {
      // 经过 index.ts 重导出：继续向下追踪源文件
      traceSymbol(exp.sourceFile, exp.originalSymbol);
    }
    return;
  }

  // 情况 B: 当前文件未直接找到，但在 export * from '...' 中
  for (const reExportFile of fileData.wildcardReExports) {
    traceSymbol(reExportFile, symbolName);
  }
}

// 4. 主流程逻辑
function run() {
  console.log(`\n🔍 正在扫描项目: ${projectRoot} ...\n`);

  // 搜集项目内所有的 TS/TSX 文件
  const allFiles = globSync('**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts', '**/*.test.*', '**/*.spec.*']
  }).map(f => path.resolve(projectRoot, f));

  // 预解析所有文件
  allFiles.forEach(analyzeFile);

  // 自动识别项目入口点文件 (Pages, Routes, App, Main, 或非 components 目录下的逻辑文件)
  const entryFiles = allFiles.filter(f => {
    const rel = path.relative(projectRoot, f).replace(/\\/g, '/');
    return (
      rel.startsWith('pages/') ||
      rel.startsWith('app/') ||
      rel.startsWith('routes/') ||
      /^(src\/)?(App|main|index)\.(tsx|ts|jsx|js)$/i.test(rel) ||
      (!rel.includes('components/') && !rel.endsWith('.tsx')) // 标记非组件的业务/逻辑文件为起点
    );
  });

  // 从所有入口点开始向下递归追踪依赖符号
  entryFiles.forEach(entry => {
    usedFiles.add(entry);
    const data = analyzeFile(entry);
    if (data) {
      data.imports.forEach(imp => traceSymbol(imp.targetFile, imp.symbolName));
    }
  });

  // 筛选出所有 .tsx 组件文件
  const allTsxComponents = allFiles.filter(f => f.endsWith('.tsx'));

  // 找出未使用的 .tsx 组件
  const unusedTsxFiles = allTsxComponents.filter(f => !usedFiles.has(f));

  // 5. 分析主未使用组件与“级联未引用的子组件”
  const unusedSet = new Set(unusedTsxFiles);
  const subComponentMap = new Map(); // ParentPath -> Array of ChildPaths
  const mainUnusedComponents = [];

  unusedTsxFiles.forEach(file => {
    const fileData = analyzeFile(file);
    let isChildOfOtherUnused = false;

    // 检查该未使用组件，是否只被其他“同样未使用的组件”所引用
    for (const otherUnused of unusedTsxFiles) {
      if (otherUnused === file) continue;
      const otherData = analyzeFile(otherUnused);
      if (otherData) {
        const referencesFile = otherData.imports.some(imp => {
          // 检查直接引用或通过 index 引用
          const exp = analyzeFile(imp.targetFile)?.exports.get(imp.symbolName);
          return imp.targetFile === file || exp?.sourceFile === file;
        });

        if (referencesFile) {
          isChildOfOtherUnused = true;
          if (!subComponentMap.has(otherUnused)) {
            subComponentMap.set(otherUnused, []);
          }
          subComponentMap.get(otherUnused).push(file);
          break;
        }
      }
    }

    if (!isChildOfOtherUnused) {
      mainUnusedComponents.push(file);
    }
  });

  // 6. 输出报告
  console.log('================ 📊 TSX 未使用组件分析报告 ================\n');

  if (mainUnusedComponents.length === 0) {
    console.log('🎉 太棒了！项目中没有发现未使用的 .tsx 组件。');
    return;
  }

  console.log(`发现 ${mainUnusedComponents.length} 个独立未使用的组件:\n`);

  mainUnusedComponents.forEach((file, index) => {
    const relativePath = path.relative(projectRoot, file);
    console.log(`${index + 1}. ❌ [未使用组件] ${relativePath}`);

    // 打印其带出的子组件
    const children = subComponentMap.get(file);
    if (children && children.length > 0) {
      children.forEach(child => {
        const childRel = path.relative(projectRoot, child);
        console.log(`   └─ 🔗 [随之失效的子组件] ${childRel}`);
      });
    }
  });

  console.log('\n===========================================================\n');
}

run();