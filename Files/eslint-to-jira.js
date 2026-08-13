#!/usr/bin/env node
/**
 * ESLint 结果转 Jira 表格脚本
 * 
 * 用法:
 *   node eslint-to-jira.js --src src/feature/claim --rule '@typescript-eslint/no-explicit-any' --batch 5
 * 
 * 输出:
 *   - eslint-jira-report.md    → Jira Markdown 表格
 *   - eslint-batch-plan.md     → 分批修复计划
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ==================== 参数解析 ====================
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    src: 'src/feature/claim',
    rule: '@typescript-eslint/no-explicit-any',
    batchSize: 10,
    outputDir: './eslint-reports',
    quiet: true
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--src': config.src = args[++i]; break;
      case '--rule': config.rule = args[++i]; break;
      case '--batch': config.batchSize = parseInt(args[++i], 10); break;
      case '--output': config.outputDir = args[++i]; break;
    }
  }

  return config;
}

// ==================== 运行 ESLint ====================
function runESLint(config) {
  const cmd = `yarn eslint ${config.src} --format json --rule '${config.rule}: error'${config.quiet ? ' --quiet' : ''}`;

  console.log(`🔍 执行: ${cmd}\n`);

  try {
    const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(result);
  } catch (error) {
    // ESLint 发现错误时退出码非 0，但 stdout 仍有 JSON 结果
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        console.error('❌ 无法解析 ESLint 输出');
        process.exit(1);
      }
    }
    console.error('❌ ESLint 执行失败:', error.message);
    process.exit(1);
  }
}

// ==================== 数据整理 ====================
function processResults(results) {
  const violations = [];
  const fileStats = new Map();

  for (const file of results) {
    const filePath = file.filePath;
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const messages = file.messages.filter(m => m.severity === 2); // error only

    if (messages.length === 0) continue;

    fileStats.set(relativePath, messages.length);

    for (const msg of messages) {
      violations.push({
        file: relativePath,
        line: msg.line,
        column: msg.column,
        message: msg.message,
        ruleId: msg.ruleId,
        severity: msg.severity === 2 ? 'Error' : 'Warning'
      });
    }
  }

  // 按文件路径排序
  violations.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  return { violations, fileStats };
}

// ==================== 生成 Jira Markdown 表格 ====================
function generateJiraTable(violations) {
  if (violations.length === 0) {
    return '🎉 未发现违规项';
  }

  // Jira Markdown 表格格式
  const lines = [
    '|| 序号 || 文件路径 || 行号 || 列号 || 规则 || 说明 ||',
  ];

  violations.forEach((v, i) => {
    // Jira 中代码用 {{ }} 包裹
    const fileCell = `{{${v.file}}}`;
    const message = v.message.replace(/\|/g, '\\|'); // 转义管道符
    lines.push(`| ${i + 1} | ${fileCell} | ${v.line} | ${v.column} | ${v.ruleId} | ${message} |`);
  });

  return lines.join('\n');
}

// ==================== 生成汇总统计 ====================
function generateSummary(violations, fileStats) {
  const totalFiles = fileStats.size;
  const totalIssues = violations.length;
  const avgPerFile = totalFiles > 0 ? (totalIssues / totalFiles).toFixed(1) : 0;

  // 按文件统计
  const sortedFiles = [...fileStats.entries()].sort((a, b) => b[1] - a[1]);

  let fileTable = '|| 文件路径 || 违规数 || 占比 ||\n';
  sortedFiles.forEach(([file, count]) => {
    const pct = ((count / totalIssues) * 100).toFixed(1);
    fileTable += `| {{${file}}} | ${count} | ${pct}% |\n`;
  });

  return {
    totalFiles,
    totalIssues,
    avgPerFile,
    fileTable,
    sortedFiles
  };
}

// ==================== 生成分批修复计划 ====================
function generateBatchPlan(violations, fileStats, batchSize) {
  const sortedFiles = [...fileStats.entries()].sort((a, b) => b[1] - a[1]);
  const batches = [];
  let currentBatch = [];
  let currentCount = 0;

  for (const [file, count] of sortedFiles) {
    // 如果当前批次加上这个文件会超量，且当前批次不为空，则新开一批
    if (currentCount + count > batchSize && currentBatch.length > 0) {
      batches.push([...currentBatch]);
      currentBatch = [];
      currentCount = 0;
    }

    currentBatch.push({ file, count });
    currentCount += count;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // 生成 Markdown
  const lines = [
    'h2. 分批修复计划',
    '',
    `共 ${fileStats.size} 个文件，${violations.length} 处违规，按每批约 ${batchSize} 个 issue 拆分。`,
    ''
  ];

  batches.forEach((batch, idx) => {
    const batchTotal = batch.reduce((sum, b) => sum + b.count, 0);
    lines.push(`h3. PR-${String(idx + 1).padStart(2, '0')} (${batch.length} 个文件, ${batchTotal} 处修复)`);
    lines.push('');
    lines.push('|| 序号 || 文件路径 || 预计修复数 || 状态 ||');

    batch.forEach((item, i) => {
      lines.push(`| ${i + 1} | {{${item.file}}} | ${item.count} | 🔲 待修复 |`);
    });

    lines.push('');
    lines.push(`*建议标题*: [Tech Debt] Fix \`${config.rule}\` in batch ${idx + 1}/${batches.length}`);
    lines.push(`*建议描述*: 本 PR 专注修复 ${batch.length} 个文件中的 \`any\` 类型，保持 review 范围清晰。`);
    lines.push('');
  });

  return { batches, markdown: lines.join('\n') };
}

// ==================== 主流程 ====================
function main() {
  const config = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ESLint → Jira 报告生成器');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📁 目标目录: ${config.src}`);
  console.log(`📏 检测规则: ${config.rule}`);
  console.log(`📦 批次大小: ${config.batchSize}`);
  console.log(`📂 输出目录: ${config.outputDir}\n`);

  // 创建输出目录
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // 1. 运行 ESLint
  const rawResults = runESLint(config);

  // 2. 处理数据
  const { violations, fileStats } = processResults(rawResults);

  console.log(`📊 发现 ${violations.length} 处违规，涉及 ${fileStats.size} 个文件\n`);

  if (violations.length === 0) {
    console.log('🎉 没有需要修复的问题');
    return;
  }

  // 3. 生成汇总
  const summary = generateSummary(violations, fileStats);

  // 4. 生成 Jira 表格
  const jiraTable = generateJiraTable(violations);

  // 5. 生成分批计划
  const { batches, markdown: batchPlan } = generateBatchPlan(violations, fileStats, config.batchSize);

  // 6. 组装完整报告
  const fullReport = [
    `h1. ESLint 修复报告: ${config.rule}`,
    '',
    'h2. 汇总统计',
    '',
    `* 总文件数: ${summary.totalFiles}`,
    `* 总违规数: ${summary.totalIssues}`,
    `* 平均每文件: ${summary.avgPerFile}`,
    `* 拆分批次数: ${batches.length}`,
    '',
    'h2. 按文件统计',
    '',
    summary.fileTable,
    '',
    'h2. 详细违规列表',
    '',
    jiraTable,
    '',
    '---',
    '',
    batchPlan,
    '',
    'h2. 修复建议',
    '',
    '* 每批 PR 控制在合理范围，便于 code review',
    '* 优先修复违规数多的文件（已按此排序）',
    '* 修复时同步补充类型定义，避免再次引入 any',
    '* 每批修复后运行 \`yarn lint\` 确认无新增违规',
    ''
  ].join('\n');

  // 7. 写入文件
  const reportPath = path.join(config.outputDir, 'eslint-jira-report.md');
  const planPath = path.join(config.outputDir, 'eslint-batch-plan.md');
  const rawPath = path.join(config.outputDir, 'eslint-raw.json');

  fs.writeFileSync(reportPath, fullReport, 'utf-8');
  fs.writeFileSync(planPath, batchPlan, 'utf-8');
  fs.writeFileSync(rawPath, JSON.stringify(rawResults, null, 2), 'utf-8');

  console.log('💾 报告已生成:');
  console.log(`   📄 ${reportPath}      ← 完整 Jira 报告（直接复制到 Jira）`);
  console.log(`   📄 ${planPath}        ← 分批计划（单独查看）`);
  console.log(`   📄 ${rawPath}         ← 原始 ESLint JSON 数据`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  分批预览');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  batches.forEach((batch, idx) => {
    const total = batch.reduce((s, b) => s + b.count, 0);
    console.log(`\nPR-${String(idx + 1).padStart(2, '0')}: ${batch.length} 文件, ${total} 处修复`);
    batch.forEach(b => {
      console.log(`   • ${b.file} (${b.count})`);
    });
  });
  console.log('\n✨ 完成！将 eslint-jira-report.md 内容复制到 Jira 即可。');
}

main();
