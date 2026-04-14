import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

const SUPPORTED_LANGUAGES: Record<string, { extension: string; compile?: string; run: string }> = {
  python: { extension: '.py', run: 'python3' },
  javascript: { extension: '.js', run: 'node' },
  java: { 
    extension: '.java', 
    compile: 'javac', 
    run: 'java' 
  },
  c: { 
    extension: '.c', 
    compile: 'gcc', 
    run: './a.out' 
  },
  cpp: { 
    extension: '.cpp', 
    compile: 'g++', 
    run: './a.out' 
  },
};

const EXECUTION_TIMEOUT = 5000;
const MEMORY_LIMIT_MB = 128;

export class CodingSandbox {
  private tempDir = '/tmp/sameeksha-sandbox';

  async executeCode(
    code: string,
    language: string,
    input?: string
  ): Promise<CodeExecutionResult> {
    const langConfig = SUPPORTED_LANGUAGES[language.toLowerCase()];
    
    if (!langConfig) {
      return {
        success: false,
        output: '',
        error: `Language ${language} is not supported`,
        executionTime: 0,
      };
    }

    const fileId = uuidv4();
    const fileName = `solution${langConfig.extension}`;
    const filePath = join(this.tempDir, fileName);

    try {
      writeFileSync(filePath, code);

      if (langConfig.compile) {
        const compileResult = await this.compile(filePath, langConfig.compile, language);
        if (!compileResult.success) {
          return compileResult;
        }
      }

      const result = await this.run(
        filePath,
        langConfig.run,
        language,
        input,
        fileId
      );

      return result;
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: 0,
      };
    } finally {
      this.cleanup(filePath, fileId);
    }
  }

  async executeTestCases(
    code: string,
    language: string,
    testCases: { input: string; expectedOutput: string; isHidden: boolean }[]
  ): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];

    const visibleTestCases = testCases.filter((tc) => !tc.isHidden);

    for (const testCase of visibleTestCases) {
      const result = await this.executeCode(code, language, testCase.input);

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.output.trim(),
        passed: result.output.trim() === testCase.expectedOutput.trim(),
      });
    }

    return results;
  }

  private async compile(
    filePath: string,
    compileCommand: string,
    language: string
  ): Promise<CodeExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const args = language === 'java' 
        ? [filePath] 
        : [filePath, '-o', filePath.replace(/(\.\w+)?$/, '.out')];

      const process = spawn(compileCommand, args, {
        timeout: EXECUTION_TIMEOUT,
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code !== 0) {
          resolve({
            success: false,
            output: '',
            error: error || 'Compilation failed',
            executionTime,
          });
        } else {
          resolve({
            success: true,
            output: '',
            error: undefined,
            executionTime,
          });
        }
      });

      process.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message,
          executionTime: Date.now() - startTime,
        });
      });
    });
  }

  private async run(
    filePath: string,
    runCommand: string,
    language: string,
    input?: string,
    fileId?: string
  ): Promise<CodeExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const args = language === 'java' || language === 'c' || language === 'cpp'
        ? []
        : [filePath];

      const stdin = input ? spawn(runCommand, args) : null;
      let output = '';
      let error = '';

      const process = stdin || spawn(runCommand, args, {
        timeout: EXECUTION_TIMEOUT,
      });

      if (stdin && input) {
        stdin.stdin?.write(input);
        stdin.stdin?.end();
      }

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', () => {
        const executionTime = Date.now() - startTime;

        resolve({
          success: error.length === 0,
          output: output.trim(),
          error: error.length > 0 ? error : undefined,
          executionTime,
        });
      });

      process.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message,
          executionTime: Date.now() - startTime,
        });
      });

      setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          output,
          error: 'Execution timeout',
          executionTime: EXECUTION_TIMEOUT,
        });
      }, EXECUTION_TIMEOUT);
    });
  }

  private cleanup(filePath: string, fileId: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      const outPath = filePath.replace(/(\.\w+)?$/, '.out');
      if (existsSync(outPath)) {
        unlinkSync(outPath);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}