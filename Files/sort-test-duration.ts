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
}

const RESULT_FILE =
  process.argv[2] ?? 'jest-results.json';

const COVERAGE_FILE =
  process.argv[3] ?? 'coverage/coverage-final.json';

const TOP_COUNT = Number(
  process.argv[4] ?? 20,
);

function loadJson<T>(filePath: string): T {
  const absolutePath = resolve(filePath);

  const content = readFileSync(
    absolutePath,
    'utf8',
  );

  return JSON.parse(content) as T;
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

function normalizePath(
  filePath: string,
): string {
  return filePath
    .replace(/\\/g, '/')
    .toLowerCase();
}

function findSourceCoverage(
  testFile: string,
  coverageData: CoverageData,
): number | undefined {
  const absoluteTestFile =
    resolve(testFile);

  const directory =
    dirname(absoluteTestFile);

  const testFileName = basename(
    absoluteTestFile,
    extname(absoluteTestFile),
  );

  const sourceFileName = testFileName
    .replace(/\.test$/, '')
    .replace(/\.spec$/, '');

  const extensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
  ];

  // Normal case:
  //
  // Page1.test.tsx
  // Page1.tsx
  //
  for (const extension of extensions) {
    const sourceFile = resolve(
      directory,
      `${sourceFileName}${extension}`,
    );

    const coverage =
      coverageData[sourceFile];

    if (coverage !== undefined) {
      return getCoveragePercentage(
        coverage,
      );
    }
  }

  // Windows / path normalization fallback
  const normalizedDirectory =
    normalizePath(directory);

  for (const [
    coveragePath,
    coverage,
  ] of Object.entries(coverageData)) {
    const normalizedCoveragePath =
      normalizePath(coveragePath);

    if (
      !normalizedCoveragePath.startsWith(
        normalizedDirectory,
      )
    ) {
      continue;
    }

    const coverageFileName =
      basename(
        normalizedCoveragePath,
        extname(normalizedCoveragePath),
      );

    if (
      coverageFileName ===
      sourceFileName.toLowerCase()
    ) {
      return getCoveragePercentage(
        coverage,
      );
    }
  }

  return undefined;
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
  filePath: string,
): string {
  return relative(
    process.cwd(),
    resolve(filePath),
  );
}

function main(): void {
  console.log(
    `Jest result: ${RESULT_FILE}`,
  );

  console.log(
    `Coverage:    ${COVERAGE_FILE}`,
  );

  const jestResult =
    loadJson<JestResult>(
      RESULT_FILE,
    );

  const coverageData =
    loadJson<CoverageData>(
      COVERAGE_FILE,
    );

  const testFiles: TestFileInfo[] =
    jestResult.testResults
      .filter(
        (result) =>
          result.startTime !== undefined &&
          result.endTime !== undefined,
      )
      .map((result) => ({
        file: result.testFilePath,
        duration:
          result.endTime! -
          result.startTime!,
        coverage:
          findSourceCoverage(
            result.testFilePath,
            coverageData,
          ),
        totalTests:
          result.numTotalTests,
      }))
      .sort(
        (a, b) =>
          b.duration - a.duration,
      );

  console.log('');
  console.log(
    '🔥 SLOWEST TEST FILES',
  );
  console.log(
    '='.repeat(110),
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
    '-'.repeat(110),
  );

  for (const [
    index,
    test,
  ] of testFiles
    .slice(0, TOP_COUNT)
    .entries()) {
    console.log(
      [
        `${index + 1}.`.padStart(4),
        formatDuration(
          test.duration,
        ).padStart(10),
        formatCoverage(
          test.coverage,
        ).padStart(10),
        String(
          test.totalTests,
        ).padStart(7),
        getRelativePath(test.file),
      ].join('  '),
    );
  }

  console.log(
    '-'.repeat(110),
  );

  console.log(
    `Test files: ${testFiles.length}`,
  );
}

main();