import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

// 配置项
const CONFIG = {
  // 组件所在的根目录
  componentsDir: 'src/components',
  // 项目入口文件或必然被使用的目录（如页面、路由、App入口等）
  entryPatterns: ['src/pages/**/*.{ts,tsx,js,jsx}', 'src/App.{ts,tsx,js,jsx}', 'src/main.{ts,tsx,js,jsx}'],
  // 支持的文件后缀
  extensions: ['.tsx', '.ts', '.jsx', '.js']
};

const projectRoot = process.cwd();

// 辅助函数：解析真实文件路径（兼容直接导入与 index.ts/index.tsx 重导出）
function resolveFilePath(baseDir, importPath) {
  const absolutePath = path.resolve(baseDir, importPath);

  // 1. 精确文件匹配
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  // 2. 尝试追加后缀匹配
  for (const ext of CONFIG.extensions) {
    if (fs.existsSync(absolutePath + ext)) {
      return absolutePath + ext;
    }
  }

  // 3. 尝试目录下的 index 文件 (兼容 index.ts 导出)
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    for (const ext of CONFIG.extensions) {
      const indexPath = path.join(absolutePath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  }

  return null;
}

// 解析单个文件的依赖（提取 import 和 export ... from）
function parseFileDependencies(filePath) {
  const dependencies = new Set();
  const code = fs.readFileSync(filePath, 'utf-8');

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    });

    traverse(ast, {
      // 处理 import 语句 (如 import { Button } from './Button')
      ImportDeclaration({ node }) {
        const resolved = resolveFilePath(path.dirname(filePath), node.source.value);
        if (resolved) dependencies.add(resolved);
      },
      // 处理 re-export 语句 (如 export * from './Button' 或 export { Button } from './Button')
      ExportAllDeclaration({ node }) {
        if (node.source) {
          const resolved = resolveFilePath(path.dirname(filePath), node.source.value);
          if (resolved) dependencies.add(resolved);
        }
      },
      ExportNamedDeclaration({ node }) {
        if (node.source) {
          const resolved = resolveFilePath(path.dirname(filePath), node.source.value);
          if (resolved) dependencies.add(resolved);
        }
      }
    });
  } catch (err) {
    console.warn(`[Warning] 解析文件 AST 失败: ${filePath}`);
  }

  return Array.from(dependencies);
}

// 主运行逻辑
function findUnusedComponents() {
  // 1. 搜集所有组件文件
  const componentFiles = globSync(`${CONFIG.componentsDir}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*']
  }).map(f => path.resolve(f));

  // 2. 搜集所有入口文件
  const entryFiles = CONFIG.entryPatterns
    .flatMap(pattern => globSync(pattern))
    .map(f => path.resolve(f));

  // 3. 构建全项目依赖拓扑图 Graph: filePath -> Set(importedFilePaths)
  const graph = new Map();
  const allProjectFiles = globSync('src/**/*.{ts,tsx,js,jsx}', { ignore: ['**/*.d.ts'] }).map(f => path.resolve(f));

  allProjectFiles.forEach(file => {
    graph.set(file, parseFileDependencies(file));
  });

  // 4. 从入口点出发，深度优先遍历 (DFS) 标记所有【已被使用】的文件
  const usedFiles = new Set();

  function markReachable(filePath) {
    if (usedFiles.has(filePath)) return;
    usedFiles.add(filePath);

    const deps = graph.get(filePath) || [];
    deps.forEach(dep => markReachable(dep));
  }

  entryFiles.forEach(entry => markReachable(entry));

  // 5. 找出未被使用的组件
  const unusedComponents = componentFiles.filter(file => !usedFiles.has(file));

  // 6. 归类整理：主组件 vs 子组件
  const componentSet = new Set(componentFiles);
  const mainUnused = [];
  const unusedSubComponentsMap = new Map(); // 父组件 -> 未被调用的子组件列表

  unusedComponents.forEach(file => {
    const relativePath = path.relative(projectRoot, file);
    // 检查该未调用的组件，是否是被其他【未使用组件】引用的“子组件”
    let isSubComponent = false;

    for (const parentFile of unusedComponents) {
      if (parentFile === file) continue;
      const parentDeps = graph.get(parentFile) || [];
      if (parentDeps.includes(file)) {
        // 说明 file 是 parentFile 的子组件/内部依赖
        isSubComponent = true;
        if (!unusedSubComponentsMap.has(parentFile)) {
          unusedSubComponentsMap.set(parentFile, []);
        }
        unusedSubComponentsMap.get(parentFile).push(relativePath);
        break;
      }
    }

    if (!isSubComponent) {
      mainUnused.push(file);
    }
  });

  // 7. 打印统计结果
  console.log('\n============== 📊 未使用组件统计报告 ==============\n');

  if (mainUnused.length === 0) {
    console.log('🎉 恭喜！项目中未发现闲置组件。');
    return;
  }

  console.log(`共发现 ${mainUnused.length} 个根级未使用的组件:\n`);

  mainUnused.forEach((file, index) => {
    const relativePath = path.relative(projectRoot, file);
    console.log(`${index + 1}. ❌ [未使用] ${relativePath}`);

    // 检查当前主未使用组件下，包含哪些同样未被外部使用的子组件
    const subs = unusedSubComponentsMap.get(file);
    if (subs && subs.length > 0) {
      subs.forEach(sub => {
        console.log(`   └─ 🔗 [级联未被外部引用子组件] ${sub}`);
      });
    }
  });

  console.log('\n====================================================\n');
}

findUnusedComponents();