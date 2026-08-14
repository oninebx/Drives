import { readFileSync } from 'node:fs';

interface AssertionResult {
  ancestorTitles: string[];
  duration?: number | null;
  fullName: string;
  status: 'passed' | 'failed' | 'pending' | 'todo' | 'disabled';
  title: string;
}

interface TestResult {
  assertionResults: AssertionResult[];
  endTime?: number;
  startTime?: number;
  testFilePath: string;
  numFailingTests: number;
  numPassingTests: number;
  numPendingTests: number;
}

interface JestResult {
  testResults: TestResult[];
}

interface TestDuration {
  duration: number;
  file: string;
  name: string;
  status: AssertionResult['status'];
}

interface FileDuration {
  duration: number;
  file: string;
  tests: number;
  failures: number;
}

const RESULT_FILE = process.argv[2] ?? 'jest-results.json';
const TOP_COUNT = Number(process.argv[3] ?? 20);

const result: JestResult = JSON.parse(
  readFileSync(RESULT_FILE, 'utf-8'),
) as JestResult;

const testDurations: TestDuration[] = [];
const fileDurations: FileDuration[] = [];

for (const testResult of result.testResults) {
  const fileDuration =
    testResult.endTime !== undefined && testResult.startTime !== undefined
      ? testResult.endTime - testResult.startTime
      : testResult.assertionResults.reduce(
          (total, assertion) => total + (assertion.duration ?? 0),
          0,
        );

  fileDurations.push({
    duration: fileDuration,
    file: testResult.testFilePath,
    tests: testResult.assertionResults.length,
    failures: testResult.numFailingTests,
  });

  for (const assertion of testResult.assertionResults) {
    testDurations.push({
      duration: assertion.duration ?? 0,
      file: testResult.testFilePath,
      name: assertion.fullName,
      status: assertion.status,
    });
  }
}

testDurations.sort((a, b) => b.duration - a.duration);
fileDurations.sort((a, b) => b.duration - a.duration);

function formatDuration(duration: number): string {
  if (duration >= 1000) {
    return `${(duration / 1000).toFixed(2)}s`;
  }

  return `${duration.toFixed(0)}ms`;
}

function relativePath(file: string): string {
  const cwd = process.cwd();

  if (file.startsWith(cwd)) {
    return file.slice(cwd.length + 1);
  }

  return file;
}

function printLine(
  rank: number,
  duration: number,
  name: string,
): void {
  console.log(
    `${String(rank).padStart(2, ' ')}. ` +
      `${formatDuration(duration).padStart(8, ' ')}  ` +
      name,
  );
}

console.log('');
console.log('🔥 TOP SLOWEST TESTS');
console.log('='.repeat(80));

for (const [index, test] of testDurations
  .filter((test) => test.duration > 0)
  .slice(0, TOP_COUNT)
  .entries()) {
  printLine(
    index + 1,
    test.duration,
    `${test.name} (${relativePath(test.file)})`,
  );
}

console.log('');
console.log('🔥 TOP SLOWEST TEST FILES');
console.log('='.repeat(80));

for (const [index, testFile] of fileDurations
  .filter((file) => file.duration > 0)
  .slice(0, TOP_COUNT)
  .entries()) {
  const failureText =
    testFile.failures > 0
      ? `, ${testFile.failures} failed`
      : '';

  printLine(
    index + 1,
    testFile.duration,
    `${relativePath(testFile.file)} ` +
      `(${testFile.tests} tests${failureText})`,
  );
}

console.log('');