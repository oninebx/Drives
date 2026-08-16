import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface FileCoverage {
  path: string;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

type CoverageData = Record<string, FileCoverage>;

interface CoverageResult {
  covered: number;
  total: number;
  percentage: number;
}

const targetFile = process.argv[2];

const coverageFile =
  process.argv[3] ??
  'coverage/coverage-final.json';

if (!targetFile) {
  console.error(
    'Usage: node scripts/get-coverage.ts <file-path> [coverage-file]',
  );
  process.exit(1);
}

const coveragePath = resolve(
  process.cwd(),
  coverageFile,
);

if (!existsSync(coveragePath)) {
  console.error(
    `Coverage file not found: ${coveragePath}`,
  );
  process.exit(1);
}

const coverage = JSON.parse(
  readFileSync(coveragePath, 'utf8'),
) as CoverageData;

function normalize(
  filePath: string,
): string {
  return filePath
    .replace(/\\/g, '/')
    .toLowerCase();
}

function calculateCoverage(
  values: number[],
): CoverageResult {
  const total = values.length;

  const covered = values.filter(
    (value) => value > 0,
  ).length;

  return {
    covered,
    total,
    percentage:
      total === 0
        ? 100
        : Number(
            (
              (covered / total) *
              100
            ).toFixed(2),
          ),
  };
}

const normalizedTarget =
  normalize(targetFile);

const entry = Object.entries(
  coverage,
).find(([filePath]) =>
  normalize(filePath).endsWith(
    normalizedTarget,
  ),
);

if (!entry) {
  console.error(
    `File not found in coverage: ${targetFile}`,
  );
  process.exit(1);
}

const [, file] = entry;

const statements =
  calculateCoverage(
    Object.values(file.s),
  );

const functions =
  calculateCoverage(
    Object.values(file.f),
  );

const branches =
  calculateCoverage(
    Object.values(file.b).flat(),
  );

console.log('');
console.log(`File: ${file.path}`);
console.log(
  `Coverage file: ${coveragePath}`,
);
console.log('');

console.log(
  `Statements: ${statements.percentage}% ` +
    `(${statements.covered}/${statements.total})`,
);

console.log(
  `Functions:  ${functions.percentage}% ` +
    `(${functions.covered}/${functions.total})`,
);

console.log(
  `Branches:   ${branches.percentage}% ` +
    `(${branches.covered}/${branches.total})`,
);