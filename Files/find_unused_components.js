const fs = require('fs');
const path = require('path');

class DependencyAnalyzer {
  constructor(projectPath, featurePath) {
    this.projectPath = path.resolve(projectPath);
    this.featurePath = path.resolve(featurePath);
    this.fileMap = new Map(); // 文件路径 -> 文件内容
    this.dependencyGraph = new Map(); // 文件路径 -> 依赖的文件路径数组
    this.reverseDependencyGraph = new Map(); // 文件路径 -> 被哪些文件引用
    this.componentExports = new Map(); // 文件路径 -> 导出的组件名
    this.entryPoints = new Set(); // 入口文件
    this.unusedComponents = new Set();
    this.visited = new Set();
  }

  // 读取所有文件
  readAllFiles(dirPath, fileList = []) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules等目录
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
          continue;
        }
        this.readAllFiles(filePath, fileList);
      } else if (this.isCodeFile(file)) {
        fileList.push(filePath);
        this.fileMap.set(filePath, fs.readFileSync(filePath, 'utf-8'));
      }
    }
    
    return fileList;
  }

  // 判断是否为代码文件
  isCodeFile(filename) {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.mjs', '.cjs'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  // 解析文件依赖
  parseDependencies(filePath, content) {
    const dependencies = [];
    const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
    const requireRegex = /require\s*\(['"](.*?)['"]\)/g;
    const dynamicImportRegex = /import\s*\(['"](.*?)['"]\)/g;
    
    let match;
    
    // 解析import语句
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(filePath, importPath);
      if (resolvedPath) {
        dependencies.push(resolvedPath);
      }
    }
    
    // 解析require语句
    while ((match = requireRegex.exec(content)) !== null) {
      const requirePath = match[1];
      const resolvedPath = this.resolveImportPath(filePath, requirePath);
      if (resolvedPath) {
        dependencies.push(resolvedPath);
      }
    }
    
    // 解析动态import
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(filePath, importPath);
      if (resolvedPath) {
        dependencies.push(resolvedPath);
      }
    }
    
    return dependencies;
  }

  // 解析导入路径
  resolveImportPath(currentFilePath, importPath) {
    // 处理相对路径
    if (importPath.startsWith('.')) {
      const currentDir = path.dirname(currentFilePath);
      let resolvedPath = path.resolve(currentDir, importPath);
      
      // 尝试添加扩展名
      const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.vue', '.mjs', '.cjs'];
      for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        if (this.fileMap.has(testPath)) {
          return testPath;
        }
      }
      
      // 尝试作为目录处理 (index文件)
      for (const ext of extensions) {
        const testPath = path.join(resolvedPath, 'index' + ext);
        if (this.fileMap.has(testPath)) {
          return testPath;
        }
      }
      
      return null;
    }
    
    // 处理绝对路径或别名路径 - 这里简化处理，实际项目中可能需要更复杂的解析
    // 检查是否在项目路径下
    const fullPath = path.resolve(this.projectPath, importPath);
    if (this.fileMap.has(fullPath)) {
      return fullPath;
    }
    
    return null;
  }

  // 构建依赖图
  buildDependencyGraph() {
    for (const [filePath, content] of this.fileMap) {
      const dependencies = this.parseDependencies(filePath, content);
      this.dependencyGraph.set(filePath, dependencies);
      
      // 构建反向依赖图
      for (const dep of dependencies) {
        if (!this.reverseDependencyGraph.has(dep)) {
          this.reverseDependencyGraph.set(dep, []);
        }
        this.reverseDependencyGraph.get(dep).push(filePath);
      }
    }
  }

  // 查找入口点（feature目录下的最上层index文件）
  findEntryPoints() {
    const featureFiles = [];
    
    // 递归查找feature目录下的所有文件
    const traverseFeatureDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          traverseFeatureDir(filePath);
        } else if (this.isCodeFile(file) && path.basename(file).startsWith('index')) {
          featureFiles.push(filePath);
        }
      }
    };
    
    if (fs.existsSync(this.featurePath)) {
      traverseFeatureDir(this.featurePath);
    }
    
    // 找到最上层的index文件（路径深度最小的）
    let minDepth = Infinity;
    for (const filePath of featureFiles) {
      const depth = filePath.split(path.sep).length;
      if (depth < minDepth) {
        minDepth = depth;
        this.entryPoints = new Set([filePath]);
      } else if (depth === minDepth) {
        this.entryPoints.add(filePath);
      }
    }
  }

  // 从入口点开始遍历可达的组件
  traverseReachableComponents() {
    const queue = Array.from(this.entryPoints);
    this.visited = new Set(queue);
    
    while (queue.length > 0) {
      const currentFile = queue.shift();
      const dependencies = this.dependencyGraph.get(currentFile) || [];
      
      for (const dep of dependencies) {
        if (!this.visited.has(dep)) {
          this.visited.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  // 识别无用组件
  findUnusedComponents() {
    const allFiles = new Set(this.fileMap.keys());
    
    // 标记被访问过的文件为有用
    const usefulFiles = this.visited;
    
    // 找出无用文件
    for (const filePath of allFiles) {
      if (!usefulFiles.has(filePath)) {
        // 检查该文件是否被其他有用组件引用
        const reverseDeps = this.reverseDependencyGraph.get(filePath) || [];
        const hasUsefulRef = reverseDeps.some(dep => usefulFiles.has(dep));
        
        if (!hasUsefulRef) {
          // 如果该文件及其所有依赖都没有被有用组件引用，则为无用
          this.unusedComponents.add(filePath);
        }
      }
    }
    
    // 进一步优化：如果一个无用的文件被另一个无用的文件引用，它们都是无用的
    // 但如果一个无用的文件被有用文件引用，它不应该被标记为无用
    // 但考虑到我们的条件是从feature无法到达，所以只要不是从feature可达的，都是无用的
    // 但需要排除被有用文件引用的文件
    for (const filePath of allFiles) {
      if (!usefulFiles.has(filePath)) {
        const reverseDeps = this.reverseDependencyGraph.get(filePath) || [];
        const hasUsefulRef = reverseDeps.some(dep => usefulFiles.has(dep));
        
        // 只有完全不被有用组件引用的，才标记为无用
        if (!hasUsefulRef) {
          this.unusedComponents.add(filePath);
        }
      }
    }
  }

  // 打印结果
  printResults() {
    console.log('\n=== 无用组件分析报告 ===\n');
    
    if (this.unusedComponents.size === 0) {
      console.log('✅ 所有组件都被使用，没有发现无用组件！');
      return;
    }
    
    console.log(`发现 ${this.unusedComponents.size} 个无用组件：\n`);
    
    // 按路径排序输出
    const sortedFiles = Array.from(this.unusedComponents).sort();
    for (const filePath of sortedFiles) {
      // 计算相对于项目路径的相对路径
      const relativePath = path.relative(this.projectPath, filePath);
      console.log(`📁 ${relativePath}`);
      
      // 显示该文件被哪些无用文件引用（帮助理解依赖链）
      const deps = this.dependencyGraph.get(filePath) || [];
      if (deps.length > 0) {
        console.log(`   依赖: ${deps.map(d => path.relative(this.projectPath, d)).join(', ')}`);
      }
      
      // 显示被哪些无用文件引用
      const reverseDeps = this.reverseDependencyGraph.get(filePath) || [];
      const unusedReverseDeps = reverseDeps.filter(dep => this.unusedComponents.has(dep));
      if (unusedReverseDeps.length > 0) {
        console.log(`   被引用: ${unusedReverseDeps.map(d => path.relative(this.projectPath, d)).join(', ')}`);
      }
      console.log('');
    }
    
    // 输出依赖链示例
    console.log('\n=== 依赖链分析 ===');
    console.log('以下是示例依赖链，帮助理解为什么这些组件被认为无用：\n');
    
    let count = 0;
    for (const filePath of sortedFiles) {
      if (count >= 3) break; // 只显示3个示例
      count++;
      
      console.log(`示例 ${count}: ${path.relative(this.projectPath, filePath)}`);
      this.printDependencyChain(filePath);
      console.log('');
    }
  }

  // 打印依赖链（用于调试）
  printDependencyChain(filePath, depth = 0, visited = new Set()) {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    
    const indent = '  '.repeat(depth);
    const relativePath = path.relative(this.projectPath, filePath);
    
    if (depth === 0) {
      console.log(`${indent}📄 ${relativePath} (无用)`);
    } else {
      console.log(`${indent}└── ${relativePath}`);
    }
    
    const deps = this.dependencyGraph.get(filePath) || [];
    for (const dep of deps) {
      if (!this.entryPoints.has(dep) && !this.visited.has(dep)) {
        this.printDependencyChain(dep, depth + 1, visited);
      }
    }
  }

  // 主方法
  analyze() {
    console.log('🔍 开始分析项目依赖...');
    console.log(`项目路径: ${this.projectPath}`);
    console.log(`Feature路径: ${this.featurePath}`);
    
    console.log('📖 读取项目文件...');
    this.readAllFiles(this.projectPath);
    console.log(`找到 ${this.fileMap.size} 个代码文件`);
    
    console.log('🔗 构建依赖图...');
    this.buildDependencyGraph();
    
    console.log('🎯 查找入口点...');
    this.findEntryPoints();
    console.log(`找到 ${this.entryPoints.size} 个入口点`);
    
    console.log('🚀 遍历可达组件...');
    this.traverseReachableComponents();
    console.log(`从入口点可达 ${this.visited.size} 个文件`);
    
    console.log('🔎 识别无用组件...');
    this.findUnusedComponents();
    
    console.log('📊 生成报告...');
    this.printResults();
  }
}

// CLI入口
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: node analyzer.js <项目路径> <feature路径>');
    console.log('示例: node analyzer.js ./my-project ./my-project/src/feature');
    process.exit(1);
  }
  
  const projectPath = args[0];
  const featurePath = args[1];
  
  if (!fs.existsSync(projectPath)) {
    console.error(`❌ 项目路径不存在: ${projectPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(featurePath)) {
    console.error(`❌ Feature路径不存在: ${featurePath}`);
    process.exit(1);
  }
  
  const analyzer = new DependencyAnalyzer(projectPath, featurePath);
  analyzer.analyze();
}

if (require.main === module) {
  main();
}

module.exports = DependencyAnalyzer;