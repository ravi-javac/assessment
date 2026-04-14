import * as ExcelJS from 'exceljs';
import { QuestionType, QuestionDifficulty, QuestionStatus } from './question.entity';
import { AppDataSource } from '../../config/database';
import { Question } from './question.entity';

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export interface MCQQuestionData {
  content: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  tags: string[];
  options: { key: string; value: string; isCorrect: boolean }[];
  correctAnswer: string;
  marks: number;
  createdById?: string;
}

export class BulkUploadService {
  async processMCQExcelFile(
    buffer: Buffer,
    createdById?: string
  ): Promise<BulkUploadResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const headers = this.getHeaders(worksheet);
    const questionRepository = AppDataSource.getRepository(Question);

    const rows: any[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const questionData = this.parseMCQRow(row, rowNumber, headers);
        if (questionData) {
          const question = questionRepository.create({
            ...questionData,
            title: questionData.content.substring(0, 255),
            createdById,
          });
          await questionRepository.save(question);
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return result;
  }

  private getHeaders(worksheet: ExcelJS.Worksheet): Record<string, number> {
    const headers: Record<string, number> = {};
    const firstRow = worksheet.getRow(1).values;

    if (firstRow) {
      (firstRow as any[]).forEach((value, index) => {
        if (value) {
          headers[value.toString().toLowerCase().trim()] = index;
        }
      });
    }

    return headers;
  }

  private parseMCQRow(
    row: ExcelJS.Row,
    rowNumber: number,
    headers: Record<string, number>
  ): MCQQuestionData | null {
    const values = row.values as any[];

    const getValue = (colNames: string[]): any => {
      for (const col of colNames) {
        const idx = headers[col.toLowerCase()];
        if (idx !== undefined && idx < values.length) {
          return values[idx];
        }
      }
      return null;
    };

    const questionStatement = getValue(['question statement', 'question statement ']) as string;
    const correctAnswerText = getValue(['correct answer-1', 'correct answer- 1']) as string;

    if (!questionStatement) {
      return null;
    }

    const options: { key: string; value: string; isCorrect: boolean }[] = [];
    const optionLabels = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
    const optionKeys = ['A', 'B', 'C', 'D', 'E'];

    for (let i = 0; i < optionLabels.length; i++) {
      const optValue = getValue([optionLabels[i], `option ${i + 1}`]) as string;
      if (optValue && optValue.trim()) {
        const isCorrect = correctAnswerText?.trim().toLowerCase() === optValue.trim().toLowerCase();
        options.push({
          key: optionKeys[i],
          value: optValue.trim(),
          isCorrect,
        });
      }
    }

    if (options.length === 0) {
      throw new Error('No options found for question');
    }

    const correctOption = options.find(o => o.isCorrect);
    if (!correctOption) {
      throw new Error('Correct answer not found among options');
    }

    const levelStr = (getValue(['level', 'difficulty']) as string)?.toLowerCase();
    let difficulty = QuestionDifficulty.MEDIUM;
    if (levelStr === 'easy') difficulty = QuestionDifficulty.EASY;
    if (levelStr === 'hard') difficulty = QuestionDifficulty.HARD;

    const stateStr = (getValue(['state', 'status']) as string)?.toLowerCase();
    let status = QuestionStatus.DRAFT;
    if (stateStr === 'ready' || stateStr === 'active') status = QuestionStatus.ACTIVE;
    if (stateStr === 'archived') status = QuestionStatus.ARCHIVED;

    const tagStr = getValue(['tag', 'tags']) as string;
    const tags = tagStr ? [tagStr.trim()] : [];

    const marks = 1;

    return {
      content: questionStatement,
      type: QuestionType.MCQ,
      difficulty,
      status,
      tags,
      options,
      correctAnswer: correctOption.value,
      marks,
    };
  }

  generateTemplate(): Buffer {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions');

    worksheet.columns = [
      { header: 'Question no.', key: 'questionNo', width: 15 },
      { header: 'Question Statement', key: 'questionStatement', width: 50 },
      { header: 'Option 1', key: 'option1', width: 40 },
      { header: 'Option 2', key: 'option2', width: 40 },
      { header: 'Option 3', key: 'option3', width: 40 },
      { header: 'Option 4', key: 'option4', width: 40 },
      { header: 'Option 5', key: 'option5', width: 40 },
      { header: 'Correct Answer-1', key: 'correctAnswer', width: 40 },
      { header: 'Use Markdown', key: 'useMarkdown', width: 15 },
      { header: 'Tag', key: 'tag', width: 25 },
      { header: 'isShuffle', key: 'isShuffle', width: 12 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Level', key: 'level', width: 15 },
      { header: 'Author', key: 'author', width: 20 },
      { header: 'Provider', key: 'provider', width: 20 },
    ];

    worksheet.addRow({
      questionNo: 1,
      questionStatement: 'What is 2 + 2?',
      option1: '3',
      option2: '4',
      option3: '5',
      option4: '6',
      option5: null,
      correctAnswer: '4',
      useMarkdown: true,
      tag: 'Math,Basic',
      isShuffle: true,
      state: 'Ready',
      level: 'Easy',
      author: 'Admin',
      provider: 'System',
    });

    return workbook.xlsx as unknown as Buffer;
  }
}
