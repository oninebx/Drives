import { readFileSync } from 'node:fs';
import {
  basename,
  dirname,
  extname,
  relative,
  resolve,
} from 'node:path';

const RESULT_FILE =
  process.argv[2] ?? 'jest-results.json';

const COVERAGE_FILE =
  process.argv[3] ?? 'coverage/coverage-final.json';

const TOP_COUNT = Number(
  process.argv[4] ?? 20,
);

function loadJson(filePath) {
  const absolutePath = resolve(filePath);

  const content = readFileSync(
    absolutePath,
    'utf8',
  );

  return JSON.parse(content);
}

function getCoveragePercentage(coverage) {
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

function normalizePath(filePath) {
  return filePath
    .replace(/\\/g, '/')
    .toLowerCase();
}

function findSourceCoverage(
  testFile,
  coverageData,
) {
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

function getTestsDuration(result) {
  return (result.assertionResults ?? [])
    .reduce(
      (total, test) =>
        total + (test.duration ?? 0),
      0,
    );
}

function formatDuration(duration) {
  if (duration >= 1000) {
    return `${(
      duration / 1000
    ).toFixed(2)}s`;
  }

  return `${Math.round(duration)}ms`;
}

function formatCoverage(coverage) {
  if (coverage === undefined) {
    return '-';
  }

  return `${coverage}%`;
}

function getRelativePath(filePath) {
  return relative(
    process.cwd(),
    resolve(filePath),
  );
}

function main() {
  console.log(
    `Jest result: ${RESULT_FILE}`,
  );

  console.log(
    `Coverage:    ${COVERAGE_FILE}`,
  );

  const jestResult =
    loadJson(RESULT_FILE);

  const coverageData =
    loadJson(COVERAGE_FILE);

  const testFiles =
    jestResult.testResults
      .filter(
        (result) =>
          result.startTime !== undefined &&
          result.endTime !== undefined,
      )
      .map((result) => {
        const duration =
          result.endTime -
          result.startTime;

        const testsDuration =
          getTestsDuration(result);

        return {
          file: result.testFilePath,
          duration,
          testsDuration,
          overhead:
            duration - testsDuration,
          coverage:
            findSourceCoverage(
              result.testFilePath,
              coverageData,
            ),
          totalTests:
            result.numTotalTests,
        };
      })
      .sort(
        (a, b) =>
          b.duration - a.duration,
      );

  console.log('');
  console.log(
    '🔥 SLOWEST TEST FILES',
  );
  console.log(
    '='.repeat(130),
  );

  console.log(
    [
      'Rank'.padStart(4),
      'File Time'.padStart(11),
      'Tests Time'.padStart(11),
      'Overhead'.padStart(11),
      'Coverage'.padStart(10),
      'Tests'.padStart(7),
      'Test File',
    ].join('  '),
  );

  console.log(
    '-'.repeat(130),
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
        ).padStart(11),
        formatDuration(
          test.testsDuration,
        ).padStart(11),
        formatDuration(
          test.overhead,
        ).padStart(11),
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
    '-'.repeat(130),
  );

  console.log(
    `Test files: ${testFiles.length}`,
  );
}

main();