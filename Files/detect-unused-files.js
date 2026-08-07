#!/usr/bin/env node
/**
 * React 项目未使用文件检测脚本
 * 
 * 用法:
 *   node detect-unused-files.js --config ./detect-config.json
 * 
 * 配置文件示例 detect-config.json:
 * {
 *   "sourcePath": "./src",
 *   "consumerDirs": ["src/pages", "src/App.tsx", "src/index.tsx"],
 *   "targetDirs": ["src/components", "src/hooks", "src/utils"],
 *   "alias": { "@": "src", "@components": "src/components" },
 *   "extensions": [".tsx", ".ts", ".jsx", ".js"],
 *   "exclude": ["**/*.test.*", "**/*.stories.*", "**/__tests__/**", "**/*.d.ts"],
 *   "output": "./unused-files-report.json"
 * }
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置解析 ====================
function parseArgs() {
  const args = process.argv.slice(2);
  let configPath = './detect-config.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configPath = args[i + 1];
      i++;
    }
  }

  if (!fs.existsSync(configPath)) {
    console.error(`❌ 配置文件不存在: ${configPath}`);
    console.error('请创建配置文件，或使用 --config 指定路径');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// ==================== 文件扫描 ====================
function shouldExclude(filePath, excludePatterns) {
  return excludePatterns.some(pattern => {
    // 支持 glob 基础语法: **/*.test.*
    const regex = new RegExp(
      '^' + 
      pattern
        .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
        .replace(/\*/g, '[^/]*')
        .replace(/<<<DOUBLESTAR>>>/g, '.*')
        .replace(/\?/g, '.')
      + '$'
    );
    return regex.test(filePath) || filePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''));
  });
}

function scanFiles(dir, extensions, excludePatterns, basePath, result = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(basePath, fullPath);

    if (shouldExclude(relPath, excludePatterns)) continue;

    if (entry.isDirectory()) {
      scanFiles(fullPath, extensions, excludePatterns, basePath, result);
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      result.push({
        absolute: fullPath,
        relative: relPath,
        name: entry.name,
        dir: path.relative(basePath, dir)
      });
    }
  }

  return result;
}

// ==================== Import 解析 ====================
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];

  // 1. ES Module: import X from 'path'
  const esmRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"];?/g;

  // 2. Dynamic import: import('path')
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // 3. CommonJS: require('path')
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // 4. Re-export: export { x } from 'path'
  const reexportRegex = /export\s+(?:\{[^}]*\}|\*\s*(?:as\s+\w+)?)\s+from\s+['"]([^'"]+)['"];?/g;

  let match;
  while ((match = esmRegex.exec(content)) !== null) imports.push(match[1]);
  while ((match = dynamicRegex.exec(content)) !== null) imports.push(match[1]);
  while ((match = cjsRegex.exec(content)) !== null) imports.push(match[1]);
  while ((match = reexportRegex.exec(content)) !== null) imports.push(match[1]);

  return [...new Set(imports)];
}

// ==================== 路径解析 ====================
function resolveImportPath(fromFile, importPath, config) {
  const { sourcePath, alias, extensions } = config;

  // 跳过 node_modules 和 URL
  if (!importPath.startsWith('.') && !importPath.startsWith('@')) {
    return null;
  }

  let resolved = importPath;

  // 处理 alias
  for (const [key, val] of Object.entries(alias || {})) {
    if (importPath === key || importPath.startsWith(key + '/')) {
      resolved = importPath.replace(key, val);
      break;
    }
  }

  // 相对路径
  if (resolved.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const base = path.resolve(fromDir, resolved);

    // 尝试直接匹配 + 扩展名 + index
    const candidates = [base];
    for (const ext of extensions) {
      candidates.push(base + ext);
    }
    for (const ext of extensions) {
      candidates.push(path.join(base, 'index' + ext));
    }

    for (const cand of candidates) {
      const relCand = path.relative(sourcePath, cand);
      if (fs.existsSync(cand)) return relCand;
    }

    // 返回相对路径（可能不存在）
    return path.relative(sourcePath, base);
  }

  // alias 解析后的绝对路径（基于 sourcePath）
  const base = path.join(sourcePath, resolved);
  const candidates = [];
  for (const ext of extensions) {
    candidates.push(base + ext);
  }
  for (const ext of extensions) {
    candidates.push(path.join(base, 'index' + ext));
  }

  for (const cand of candidates) {
    if (fs.existsSync(cand)) return path.relative(sourcePath, cand);
  }

  return resolved;
}

// ==================== 可达性分析 ====================
function buildReachableFiles(allFiles, config) {
  const { sourcePath, consumerDirs } = config;
  const fileMap = new Map();
  allFiles.forEach(f => fileMap.set(f.relative, f));

  const reachable = new Set();
  const queue = [];

  // 初始化消费者入口
  for (const consumer of consumerDirs) {
    const consumerPath = path.join(sourcePath, consumer);

    if (fs.existsSync(consumerPath)) {
      const stat = fs.statSync(consumerPath);
      if (stat.isDirectory()) {
        // 如果是目录，递归添加目录下所有文件作为入口
        const dirFiles = scanFiles(consumerPath, config.extensions, [], sourcePath);
        dirFiles.forEach(f => {
          if (!reachable.has(f.relative)) {
            reachable.add(f.relative);
            queue.push(f.relative);
          }
        });
      } else {
        // 单个文件
        const rel = path.relative(sourcePath, consumerPath);
        if (!reachable.has(rel)) {
          reachable.add(rel);
          queue.push(rel);
        }
      }
    } else {
      console.warn(`⚠️  消费者路径不存在: ${consumerPath}`);
    }
  }

  // BFS
  let idx = 0;
  while (idx < queue.length) {
    const currentRel = queue[idx++];
    const currentAbs = path.join(sourcePath, currentRel);

    if (!fs.existsSync(currentAbs)) continue;

    const imports = extractImports(currentAbs);

    for (const imp of imports) {
      const resolvedRel = resolveImportPath(currentAbs, imp, config);
      if (resolvedRel && fileMap.has(resolvedRel) && !reachable.has(resolvedRel)) {
        reachable.add(resolvedRel);
        queue.push(resolvedRel);
      }
    }
  }

  return reachable;
}

// ==================== 主流程 ====================
function main() {
  console.log('🔍 React 未使用文件检测\n');

  const config = parseArgs();
  const sourcePath = path.resolve(config.sourcePath || './src');
  config.sourcePath = sourcePath;
  config.extensions = config.extensions || ['.tsx', '.ts', '.jsx', '.js'];
  config.exclude = config.exclude || ['**/*.test.*', '**/*.stories.*', '**/__tests__/**', '**/*.d.ts'];
  config.output = config.output || './unused-files-report.json';
  config.alias = config.alias || {};

  console.log(`📁 源码路径: ${sourcePath}`);
  console.log(`🎯 待检测目录: ${(config.targetDirs || []).join(', ')}`);
  console.log(`👥 消费者目录: ${(config.consumerDirs || []).join(', ')}`);
  console.log('');

  // 1. 扫描所有文件
  const allFiles = scanFiles(sourcePath, config.extensions, config.exclude, sourcePath);
  console.log(`📊 扫描到 ${allFiles.length} 个源文件`);

  // 2. 可达性分析
  const reachable = buildReachableFiles(allFiles, config);
  console.log(`✅ 可达文件: ${reachable.size} 个`);

  // 3. 检查目标目录
  const targetDirs = (config.targetDirs || []).map(d => 
    path.relative(process.cwd(), path.join(sourcePath, d)).replace(/\\/g, '/')
  );

  const unusedFiles = [];
  const usedFiles = [];

  for (const file of allFiles) {
    const fileDir = file.dir.replace(/\\/g, '/');
    const isInTarget = targetDirs.some(td => 
      fileDir === td || fileDir.startsWith(td + '/')
    );

    if (!isInTarget) continue;

    if (reachable.has(file.relative)) {
      usedFiles.push(file.relative);
    } else {
      unusedFiles.push({
        path: file.relative,
        absolute: file.absolute,
        dir: file.dir,
        name: file.name
      });
    }
  }

  console.log(`🗑️  目标目录中未使用文件: ${unusedFiles.length} 个\n`);

  // 4. 生成报告
  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      sourcePath: sourcePath,
      consumerDirs: config.consumerDirs,
      targetDirs: config.targetDirs,
      totalFiles: allFiles.length,
      reachableFiles: reachable.size,
      unusedCount: unusedFiles.length
    },
    unusedFiles: unusedFiles,
    usedFiles: usedFiles,
    reachableFiles: [...reachable].sort(),
    allFiles: allFiles.map(f => f.relative).sort()
  };

  const outputPath = path.resolve(config.output);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`💾 报告已保存: ${outputPath}`);
  console.log('\n🗑️  未使用文件列表:');
  if (unusedFiles.length === 0) {
    console.log('   🎉 未发现未使用文件');
  } else {
    unusedFiles.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.path}`);
    });
  }

  console.log('\n✨ 检测完成');
}

main();
