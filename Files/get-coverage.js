const fs = require('fs');
const path = require('path');

const coverageFile = path.resolve(
  process.cwd(),
  'coverage/coverage-final.json'
);

const targetFile = process.argv[2];

if (!targetFile) {
  console.error('Usage: node scripts/get-coverage.js <file-path>');
  process.exit(1);
}

if (!fs.existsSync(coverageFile)) {
  console.error(`Coverage file not found: ${coverageFile}`);
  process.exit(1);
}

const coverage = JSON.parse(
  fs.readFileSync(coverageFile, 'utf8')
);

const normalize = filePath =>
  filePath.replace(/\\/g, '/');

const normalizedTarget = normalize(targetFile);

const entry = Object.entries(coverage).find(([filePath]) =>
  normalize(filePath).endsWith(normalizedTarget)
);

if (!entry) {
  console.error(`File not found in coverage: ${targetFile}`);
  process.exit(1);
}

const [, file] = entry;

const calculateCoverage = values => {
  const total = values.length;
  const covered = values.filter(value => value > 0).length;

  return {
    covered,
    total,
    percentage: total === 0
      ? 100
      : Number(((covered / total) * 100).toFixed(2)),
  };
};

const statements = calculateCoverage(
  Object.values(file.s)
);

const functions = calculateCoverage(
  Object.values(file.f)
);

const branches = calculateCoverage(
  Object.values(file.b).flat()
);

console.log('');
console.log(`File: ${file.path}`);
console.log('');
console.log(
  `Statements: ${statements.percentage}% ` +
  `(${statements.covered}/${statements.total})`
);
console.log(
  `Functions:  ${functions.percentage}% ` +
  `(${functions.covered}/${functions.total})`
);
console.log(
  `Branches:   ${branches.percentage}% ` +
  `(${branches.covered}/${branches.total})`
);