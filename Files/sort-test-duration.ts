import { readFileSync } from 'node:fs';
import {
  basename,
  dirname,
  extname,
  relative,
  resolve,
} from 'node:path';

interface TestResult {
  testFilePath: string;
  startTime?: number;
  endTime?: number;
  numTotalTests: number;
  numPassingTests: number;
  numFailingTests: number;
  numPendingTests: number;
}

interface JestResult {
  testResults: TestResult[];
}

interface FileCoverage {
  s: Record<string, number>;
}

type CoverageData = Record<string, FileCoverage>;

interface TestFileInfo {
  file: string;
  duration: number;
  coverage?: number;
  totalTests: number;
  passingTests: number;
  failingTests: number;
  pendingTests: number;
}

const DEFAULT_RESULT_FILE = 'jest-results.json';
const DEFAULT_COVERAGE_FILE =
  'coverage/coverage-final.json';

const DEFAULT_TOP_COUNT = 20;

const resultFile =
  process.argv[2] ?? DEFAULT_RESULT_FILE;

const coverageFile =
  process.argv[3] ?? DEFAULT_COVERAGE_FILE;

const topCount = parseTopCount(
  process.argv[4],
  DEFAULT_TOP_COUNT,
);

function parseTopCount(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(
      `Invalid top count "${value}". Using ${defaultValue}.`,
    );

    return defaultValue;
  }

  return parsed;
}

function loadJson<T>(file: string): T {
  const filePath = resolve(file);

  try {
    const content = readFileSync(
      filePath,
      'utf-8',
    );

    return JSON.parse(content) as T;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    throw new Error(
      `Failed to read JSON file "${filePath}": ${message}`,
    );
  }
}

function getCoveragePercentage(
  coverage: FileCoverage,
): number | undefined {
  const statements = Object.values(
    coverage.s,
  );

  if (statements.length === 0) {
    return undefined;
  }

  const covered = statements.filter(
    (count) => count > 0,
  ).length;

  return Math.round(
    (covered / statements.length) * 100,
  );
}

/**
 * Find the source file corresponding to a test file.
 *
 * Example:
 *
 *   Page1.test.tsx
 *       ↓
 *   Page1.tsx
 */
function findSourceCoverage(
  testFile: string,
  coverageData: CoverageData,
): number | undefined {
  const absoluteTestFile = resolve(
    testFile,
  );

  const directory = dirname(
    absoluteTestFile,
  );

  const testFileName = basename(
    absoluteTestFile,
    extname(absoluteTestFile),
  );

  const sourceFileName = testFileName
    .replace(/\.test$/, '')
    .replace(/\.spec$/, '');

  const sourceExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
  ];

  for (const extension of sourceExtensions) {
    const sourceFile = resolve(
      directory,
      `${sourceFileName}${extension}`,
    );

    const coverage = coverageData[sourceFile];

    if (coverage !== undefined) {
      return getCoveragePercentage(coverage);
    }
  }

  /*
   * Jest coverage paths may use a different
   * path representation, especially on Windows.
   *
   * Fall back to matching the normalized path.
   */
  const normalizedDirectory =
    normalizePath(directory);

  for (const [coveragePath, coverage] of Object.entries(
    coverageData,
  )) {
    const normalizedCoveragePath =
      normalizePath(coveragePath);

    const normalizedSourceFileName =
      normalizePath(
        `${sourceFileName}`,
      );

    if (
      normalizedCoveragePath.startsWith(
        normalizedDirectory,
      ) &&
      basename(
        normalizedCoveragePath,
        extname(normalizedCoveragePath),
      ) === normalizedSourceFileName
    ) {
      return getCoveragePercentage(
        coverage,
      );
    }
  }

  return undefined;
}

function normalizePath(
  path: string,
): string {
  return path
    .replace(/\\/g, '/')
    .toLowerCase();
}

function formatDuration(
  duration: number,
): string {
  if (duration >= 1000) {
    return `${(
      duration / 1000
    ).toFixed(2)}s`;
  }

  return `${Math.round(duration)}ms`;
}

function formatCoverage(
  coverage: number | undefined,
): string {
  if (coverage === undefined) {
    return '-';
  }

  return `${coverage}%`;
}

function getRelativePath(
  file: string,
): string {
  return relative(
    process.cwd(),
    resolve(file),
  );
}

function createTestFileInfo(
  result: TestResult,
  coverageData: CoverageData,
): TestFileInfo | undefined {
  if (
    result.startTime === undefined ||
    result.endTime === undefined
  ) {
    return undefined;
  }

  const duration =
    result.endTime - result.startTime;

  return {
    file: result.testFilePath,
    duration,
    coverage: findSourceCoverage(
      result.testFilePath,
      coverageData,
    ),
    totalTests: result.numTotalTests,
    passingTests:
      result.numPassingTests,
    failingTests:
      result.numFailingTests,
    pendingTests:
      result.numPendingTests,
  };
}

function printReport(
  testFiles: TestFileInfo[],
  count: number,
): void {
  const sortedFiles = [...testFiles]
    .sort(
      (a, b) => b.duration - a.duration,
    )
    .slice(0, count);

  console.log('');
  console.log(
    '🔥 SLOWEST TEST FILES',
  );
  console.log(
    '='.repeat(120),
  );

  console.log(
    [
      'Rank'.padStart(4),
      'Duration'.padStart(10),
      'Coverage'.padStart(10),
      'Tests'.padStart(7),
      'Test File',
    ].join('  '),
  );

  console.log(
    '-'.repeat(120),
  );

  for (const [
    index,
    testFile,
  ] of sortedFiles.entries()) {
    console.log(
      [
        `${index + 1}.`.padStart(4),
        formatDuration(
          testFile.duration,
        ).padStart(10),
        formatCoverage(
          testFile.coverage,
        ).padStart(10),
        String(
          testFile.totalTests,
        ).padStart(7),
        getRelativePath(
          testFile.file,
        ),
      ].join('  '),
    );
  }

  console.log(
    '-'.repeat(120),
  );

  const totalDuration =
    testFiles.reduce(
      (total, testFile) =>
        total + testFile.duration,
      0,
    );

  const averageDuration =
    testFiles.length > 0
      ? totalDuration / testFiles.length
      : 0;

  console.log(
    `Test files: ${testFiles.length}`,
  );

  console.log(
    `Total test file time: ${formatDuration(
      totalDuration,
    )}`,
  );

  console.log(
    `Average test file time: ${formatDuration(
      averageDuration,
    )}`,
  );

  console.log('');
}

function main(): void {
  console.log(
    `Reading Jest results from: ${resolve(
      resultFile,
    )}`,
  );

  console.log(
    `Reading coverage from: ${resolve(
      coverageFile,
    )}`,
  );

  const jestResult =
    loadJson<JestResult>(
      resultFile,
    );

  const coverageData =
    loadJson<CoverageData>(
      coverageFile,
    );

  const testFiles = jestResult.testResults
    .map((result) =>
      createTestFileInfo(
        result,
        coverageData,
      ),
    )
    .filter(
      (
        result,
      ): result is TestFileInfo =>
        result !== undefined,
    );

  if (testFiles.length === 0) {
    console.log('');
    console.log(
      'No test file timing information found.',
    );
    return;
  }

  printReport(
    testFiles,
    topCount,
  );
}

try {
  main();
} catch (error) {
  console.error('');

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
}