#!/usr/bin/env node
/**
 * React 项目未使用文件检测脚本（增强版 - 支持命名导出追踪）
 * 
 * 核心改进：
 *   1. 解析 index.ts 中的 re-export 映射关系
 *   2. 追踪消费者 import { x, y } 中具体使用了哪些命名导出
 *   3. 只有被实际引用的命名导出对应的源文件才标记为可达
 *   4. 支持 export * from './x' 的通配符追踪
 * 
 * 用法:
 *   node detect-unused-files-enhanced.js --config ./detect-config.json
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
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// ==================== 工具函数 ====================
function shouldExclude(filePath, excludePatterns) {
  return excludePatterns.some(pattern => {
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
    const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/');

    if (shouldExclude(relPath, excludePatterns)) continue;

    if (entry.isDirectory()) {
      scanFiles(fullPath, extensions, excludePatterns, basePath, result);
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      result.push({
        absolute: fullPath,
        relative: relPath,
        name: entry.name,
        dir: path.relative(basePath, dir).replace(/\\/g, '/')
      });
    }
  }

  return result;
}

// ==================== AST 级 Import/Export 解析 ====================

/**
 * 从文件中提取所有 import 信息
 * 返回: [{ source: './Button', named: ['Button', 'Primary'], default: 'Btn', namespace: null }]
 */
function extractImportDetails(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];

  // 1. import { a, b } from './x'
  // 2. import Default, { a, b } from './x'
  // 3. import * as NS from './x'
  // 4. import Default from './x'
  const importRegex = /import\s+(?:(\*\s+as\s+(\w+))|(\w+)(?:\s*,\s*)?)?\s*(?:\{([^}]*)\})?\s*from\s+['"]([^'"]+)['"];?/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const [, , namespaceName, defaultName, namedStr, source] = match;

    const named = [];
    if (namedStr) {
      // 解析 { Button, Primary as MainBtn } -> ['Button', 'Primary']
      namedStr.split(',').forEach(s => {
        const trimmed = s.trim();
        if (!trimmed) return;
        // 处理 "as" 别名: "Primary as MainBtn" -> 取原始名 Primary
        const parts = trimmed.split(/\s+as\s+/);
        named.push(parts[0].trim());
      });
    }

    imports.push({
      source: source.trim(),
      named: named,
      default: defaultName ? defaultName.trim() : null,
      namespace: namespaceName ? namespaceName.trim() : null
    });
  }

  // 5. dynamic import: import('./x')
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    imports.push({
      source: match[1].trim(),
      named: [],
      default: null,
      namespace: null,
      isDynamic: true
    });
  }

  // 6. require('./x')
  const cjsRegex = /(?:const|let|var)\s+(?:\{([^}]*)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRegex.exec(content)) !== null) {
    const namedStr = match[1];
    const defaultName = match[2];
    const source = match[3];

    const named = [];
    if (namedStr) {
      namedStr.split(',').forEach(s => {
        const trimmed = s.trim();
        if (!trimmed) return;
        named.push(trimmed);
      });
    }

    imports.push({
      source: source.trim(),
      named: named,
      default: defaultName ? defaultName.trim() : null,
      namespace: null
    });
  }

  return imports;
}

/**
 * 从文件中提取所有 export 信息（特别是 re-export）
 * 返回: {
 *   namedReexports: [{ name: 'Button', source: './Button', isReexport: true }],
 *   starReexports: ['./components'],  // export * from './x'
 *   localExports: ['useAuth', 'formatDate']
 * }
 */
function extractExportDetails(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  const namedReexports = [];
  const starReexports = [];
  const localExports = [];

  // 1. export { Button, Primary } from './Button'
  //    export { Button as default } from './Button'
  const reexportRegex = /export\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?/g;
  let match;
  while ((match = reexportRegex.exec(content)) !== null) {
    const namedStr = match[1];
    const source = match[2].trim();

    namedStr.split(',').forEach(s => {
      const trimmed = s.trim();
      if (!trimmed) return;

      // 处理 "Button as default" 或 "Button as Btn"
      const parts = trimmed.split(/\s+as\s+/);
      const originalName = parts[0].trim();
      const exportedName = parts[1] ? parts[1].trim() : originalName;

      namedReexports.push({
        name: exportedName,      // 外部看到的名字
        originalName: originalName, // 源文件中的名字
        source: source
      });
    });
  }

  // 2. export * from './components'
  const starRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"];?/g;
  while ((match = starRegex.exec(content)) !== null) {
    starReexports.push(match[1].trim());
  }

  // 3. export const x = ... / export function x() / export class X
  const localExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  while ((match = localExportRegex.exec(content)) !== null) {
    localExports.push(match[1].trim());
  }

  // 4. export { x, y } (本地导出)
  const localNamedRegex = /export\s+\{([^}]*)\}(?!\s*from)/g;
  while ((match = localNamedRegex.exec(content)) !== null) {
    match[1].split(',').forEach(s => {
      const trimmed = s.trim().split(/\s+as\s+/)[0].trim();
      if (trimmed) localExports.push(trimmed);
    });
  }

  // 5. export default ...
  if (/export\s+default/.test(content)) {
    localExports.push('default');
  }

  return { namedReexports, starReexports, localExports };
}

// ==================== 路径解析 ====================
function resolveImportPath(fromFile, importPath, config) {
  const { sourcePath, alias, extensions } = config;

  if (!importPath.startsWith('.') && !importPath.startsWith('@')) {
    return null;
  }

  let resolved = importPath;

  for (const [key, val] of Object.entries(alias || {})) {
    if (importPath === key || importPath.startsWith(key + '/')) {
      resolved = importPath.replace(key, val);
      break;
    }
  }

  if (resolved.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const base = path.resolve(fromDir, resolved);

    const candidates = [base];
    for (const ext of extensions) candidates.push(base + ext);
    for (const ext of extensions) candidates.push(path.join(base, 'index' + ext));

    for (const cand of candidates) {
      if (fs.existsSync(cand)) return path.relative(sourcePath, cand).replace(/\\/g, '/');
    }
    return path.relative(sourcePath, base).replace(/\\/g, '/');
  }

  const base = path.join(sourcePath, resolved);
  const candidates = [];
  for (const ext of extensions) candidates.push(base + ext);
  for (const ext of extensions) candidates.push(path.join(base, 'index' + ext));

  for (const cand of candidates) {
    if (fs.existsSync(cand)) return path.relative(sourcePath, cand).replace(/\\/g, '/');
  }

  return resolved;
}

// ==================== 核心：带命名导出的可达性分析 ====================

/**
 * 分析单个文件的 re-export 映射
 * 返回: Map<导出名称, 源文件相对路径>
 */
function buildReexportMap(filePath, fileRelPath, config, fileMap) {
  const exports = extractExportDetails(filePath);
  const map = new Map(); // exportedName -> sourceFileRel

  // 处理 named re-export: export { Button } from './Button'
  for (const re of exports.namedReexports) {
    const sourceRel = resolveImportPath(filePath, re.source, config);
    if (sourceRel && fileMap.has(sourceRel)) {
      map.set(re.name, sourceRel);
    }
  }

  // 处理 star re-export: export * from './components'
  // 这种情况无法精确追踪，我们标记整个源文件为"通配导出"
  for (const star of exports.starReexports) {
    const sourceRel = resolveImportPath(filePath, star, config);
    if (sourceRel && fileMap.has(sourceRel)) {
      map.set('*__STAR__' + star, sourceRel); // 特殊标记
    }
  }

  return map;
}

/**
 * 可达性分析（增强版）
 * 不仅追踪文件级可达，还追踪命名导出级可达
 */
function buildReachableFiles(allFiles, config) {
  const { sourcePath, consumerDirs } = config;
  const fileMap = new Map();
  allFiles.forEach(f => fileMap.set(f.relative, f));

  // 预计算所有 index 文件的 re-export 映射
  const indexReexportMaps = new Map(); // fileRel -> Map<exportName, sourceRel>
  for (const file of allFiles) {
    if (file.name === 'index.ts' || file.name === 'index.tsx' || 
        file.name === 'index.js' || file.name === 'index.jsx') {
      const map = buildReexportMap(file.absolute, file.relative, config, fileMap);
      if (map.size > 0) {
        indexReexportMaps.set(file.relative, map);
      }
    }
  }

  // 可达集合: Set<"fileRel#exportName" | "fileRel#__ALL__">
  // __ALL__ 表示整个文件可达（被 import * 或 default import）
  const reachable = new Set();
  const queue = [];

  // 初始化消费者入口
  for (const consumer of consumerDirs) {
    const consumerPath = path.join(sourcePath, consumer);

    if (fs.existsSync(consumerPath)) {
      const stat = fs.statSync(consumerPath);
      if (stat.isDirectory()) {
        const dirFiles = scanFiles(consumerPath, config.extensions, [], sourcePath);
        dirFiles.forEach(f => {
          const key = f.relative + '#__ALL__';
          if (!reachable.has(key)) {
            reachable.add(key);
            queue.push({ fileRel: f.relative, mode: '__ALL__' });
          }
        });
      } else {
        const rel = path.relative(sourcePath, consumerPath).replace(/\\/g, '/');
        const key = rel + '#__ALL__';
        if (!reachable.has(key)) {
          reachable.add(key);
          queue.push({ fileRel: rel, mode: '__ALL__' });
        }
      }
    } else {
      console.warn(`⚠️  消费者路径不存在: ${consumerPath}`);
    }
  }

  // BFS
  let idx = 0;
  while (idx < queue.length) {
    const { fileRel, mode } = queue[idx++];
    const fileAbs = path.join(sourcePath, fileRel);

    if (!fs.existsSync(fileAbs)) continue;

    const imports = extractImportDetails(fileAbs);

    for (const imp of imports) {
      const resolvedRel = resolveImportPath(fileAbs, imp.source, config);
      if (!resolvedRel || !fileMap.has(resolvedRel)) continue;

      const targetFile = fileMap.get(resolvedRel);
      const isIndexFile = targetFile.name.startsWith('index.');
      const reexportMap = indexReexportMaps.get(resolvedRel);

      // 情况1: namespace import (import * as X) 或 dynamic import
      // 视为使用整个模块
      if (imp.namespace || imp.isDynamic) {
        const key = resolvedRel + '#__ALL__';
        if (!reachable.has(key)) {
          reachable.add(key);
          queue.push({ fileRel: resolvedRel, mode: '__ALL__' });
        }
        continue;
      }

      // 情况2: default import
      if (imp.default) {
        if (isIndexFile && reexportMap && reexportMap.has('default')) {
          // index.ts 中 re-export 了 default
          const sourceRel = reexportMap.get('default');
          const key = sourceRel + '#__ALL__';
          if (!reachable.has(key)) {
            reachable.add(key);
            queue.push({ fileRel: sourceRel, mode: '__ALL__' });
          }
        } else {
          const key = resolvedRel + '#__ALL__';
          if (!reachable.has(key)) {
            reachable.add(key);
            queue.push({ fileRel: resolvedRel, mode: '__ALL__' });
          }
        }
      }

      // 情况3: named imports
      for (const named of imp.named) {
        if (isIndexFile && reexportMap) {
          // 检查这个 named import 是否对应 index 中的某个 re-export
          if (reexportMap.has(named)) {
            const sourceRel = reexportMap.get(named);
            const key = sourceRel + '#' + named;
            if (!reachable.has(key)) {
              reachable.add(key);
              queue.push({ fileRel: sourceRel, mode: named });
            }
          } else if (reexportMap.has('*__STAR__' + named)) {
            // 来自 star re-export，无法精确追踪，标记整个源文件
            const sourceRel = reexportMap.get('*__STAR__' + named);
            const key = sourceRel + '#__ALL__';
            if (!reachable.has(key)) {
              reachable.add(key);
              queue.push({ fileRel: sourceRel, mode: '__ALL__' });
            }
          } else {
            // named import 但不在 re-export map 中，可能是本地导出
            const key = resolvedRel + '#' + named;
            if (!reachable.has(key)) {
              reachable.add(key);
              queue.push({ fileRel: resolvedRel, mode: named });
            }
          }
        } else {
          // 非 index 文件，直接标记
          const key = resolvedRel + '#' + named;
          if (!reachable.has(key)) {
            reachable.add(key);
            queue.push({ fileRel: resolvedRel, mode: named });
          }
        }
      }

      // 情况4: 没有 named/default/namespace，只有 side-effect import (import './x')
      // 标记整个文件可达
      if (!imp.default && imp.named.length === 0 && !imp.namespace) {
        const key = resolvedRel + '#__ALL__';
        if (!reachable.has(key)) {
          reachable.add(key);
          queue.push({ fileRel: resolvedRel, mode: '__ALL__' });
        }
      }
    }
  }

  return { reachable, indexReexportMaps };
}

// ==================== 判断文件是否被使用 ====================

/**
 * 判断一个文件是否被使用
 * 规则：
 *   1. 如果是 index 文件：检查它的 re-export 中，有多少被实际引用
 *   2. 如果是普通文件：检查是否有任何导出被引用
 *   3. 如果文件被 side-effect import（import './x'），整个文件可达
 */
function isFileUsed(fileRel, reachable, indexReexportMaps) {
  // 检查是否有 __ALL__ 可达
  if (reachable.has(fileRel + '#__ALL__')) return { used: true, reason: 'full_import' };

  const reexportMap = indexReexportMaps.get(fileRel);

  if (reexportMap) {
    // 这是 index 文件，检查它的 re-export 有多少被使用
    const usedExports = [];
    const unusedExports = [];

    for (const [exportName, sourceRel] of reexportMap.entries()) {
      if (exportName.startsWith('*__STAR__')) {
        // star re-export，检查是否有对应的命名导入
        // 简化处理：如果源文件有任何可达标记，认为被使用
        const isUsed = [...reachable].some(k => k.startsWith(sourceRel + '#'));
        if (isUsed) {
          usedExports.push({ name: '*', source: sourceRel });
        } else {
          unusedExports.push({ name: '*', source: sourceRel });
        }
      } else {
        const isUsed = reachable.has(fileRel + '#' + exportName) || 
                       reachable.has(sourceRel + '#' + exportName) ||
                       reachable.has(sourceRel + '#__ALL__');
        if (isUsed) {
          usedExports.push({ name: exportName, source: sourceRel });
        } else {
          unusedExports.push({ name: exportName, source: sourceRel });
        }
      }
    }

    return {
      used: usedExports.length > 0,
      isIndex: true,
      usedExports,
      unusedExports,
      reason: usedExports.length > 0 ? 'partial' : 'none'
    };
  } else {
    // 普通文件，检查是否有任何导出被引用
    const hasNamedReach = [...reachable].some(k => k.startsWith(fileRel + '#'));
    return { used: hasNamedReach, reason: hasNamedReach ? 'named_import' : 'none' };
  }
}

// ==================== 主流程 ====================
function main() {
  console.log('🔍 React 未使用文件检测（增强版 - 命名导出追踪）\n');

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

  // 2. 可达性分析（增强版）
  const { reachable, indexReexportMaps } = buildReachableFiles(allFiles, config);
  console.log(`✅ 可达标记数: ${reachable.size} 个（文件+导出级别）`);

  // 统计 index 文件
  const indexFiles = allFiles.filter(f => f.name.startsWith('index.'));
  console.log(`📇 Index 文件数: ${indexFiles.length} 个`);
  console.log('');

  // 3. 检查目标目录
  const targetDirs = (config.targetDirs || []).map(d => 
    path.relative(process.cwd(), path.join(sourcePath, d)).replace(/\\/g, '/')
  );

  const unusedFiles = [];
  const usedFiles = [];
  const indexAnalysis = [];

  for (const file of allFiles) {
    const fileDir = file.dir.replace(/\\/g, '/');
    const isInTarget = targetDirs.some(td => 
      fileDir === td || fileDir.startsWith(td + '/')
    );

    if (!isInTarget) continue;

    const usage = isFileUsed(file.relative, reachable, indexReexportMaps);

    if (usage.used) {
      usedFiles.push({
        path: file.relative,
        reason: usage.reason,
        usedExports: usage.usedExports || null
      });
    } else {
      unusedFiles.push({
        path: file.relative,
        absolute: file.absolute,
        dir: file.dir,
        name: file.name,
        reason: usage.reason,
        unusedExports: usage.unusedExports || null
      });
    }

    if (usage.isIndex) {
      indexAnalysis.push({
        path: file.relative,
        usedExports: usage.usedExports,
        unusedExports: usage.unusedExports
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
      indexFiles: indexFiles.length,
      reachableMarks: reachable.size,
      unusedCount: unusedFiles.length
    },
    unusedFiles: unusedFiles,
    usedFiles: usedFiles,
    indexAnalysis: indexAnalysis,
    reachableDetails: [...reachable].sort(),
    allFiles: allFiles.map(f => f.relative).sort()
  };

  const outputPath = path.resolve(config.output);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`💾 报告已保存: ${outputPath}\n`);

  // 5. 输出摘要
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 检测结果摘要');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (unusedFiles.length === 0) {
    console.log('   🎉 未发现未使用文件\n');
  } else {
    console.log(`   🗑️  未使用文件 (${unusedFiles.length} 个):\n`);
    unusedFiles.forEach((f, i) => {
      console.log(`   ${String(i + 1).padStart(2)}. ${f.path}`);
      if (f.unusedExports && f.unusedExports.length > 0) {
        f.unusedExports.forEach(e => {
          console.log(`       └─ 未使用导出: ${e.name} → ${e.source}`);
        });
      }
    });
  }

  if (indexAnalysis.length > 0) {
    console.log('\n   📇 Index 文件精细分析:\n');
    indexAnalysis.forEach(idx => {
      const total = (idx.usedExports || []).length + (idx.unusedExports || []).length;
      const used = (idx.usedExports || []).length;
      console.log(`   ${idx.path} (${used}/${total} 导出被使用)`);
      if (idx.unusedExports && idx.unusedExports.length > 0) {
        idx.unusedExports.forEach(e => {
          console.log(`       └─ ⚠️  未使用 re-export: ${e.name} from ${e.source}`);
        });
      }
    });
  }

  console.log('\n✨ 检测完成');
}

main();
