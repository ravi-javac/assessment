import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Batch } from './batch.entity';
import { User, UserRole, UserStatus } from './user.entity';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';

export class BatchService {
  private batchRepository: Repository<Batch>;
  private userRepository: Repository<User>;

  constructor() {
    this.batchRepository = AppDataSource.getRepository(Batch);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async findAll(): Promise<Batch[]> {
    return this.batchRepository.find({
      relations: ['assignedFaculty', 'students'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Batch | null> {
    return this.batchRepository.findOne({
      where: { id },
      relations: ['assignedFaculty', 'students']
    });
  }

  async create(data: Partial<Batch>): Promise<Batch> {
    const batch = this.batchRepository.create(data);
    return this.batchRepository.save(batch);
  }

  async update(id: string, data: Partial<Batch>): Promise<Batch | null> {
    await this.batchRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.batchRepository.delete(id);
  }

  async assignFacultyToBatch(batchId: string, facultyIds: string[]): Promise<Batch | null> {
    const batch = await this.findOne(batchId);
    if (!batch) return null;

    const faculty = await this.userRepository.find({
      where: { id: In(facultyIds), role: UserRole.FACULTY }
    });

    batch.assignedFaculty = faculty;
    return this.batchRepository.save(batch);
  }

  async parseExcelStudents(buffer: Buffer): Promise<any[]> {
    // Check if it's a CSV (simple check for ASCII/UTF-8 text)
    const isCSV = buffer.slice(0, 100).toString().includes(',') || !buffer.slice(0, 4).toString().includes('PK');
    
    if (isCSV) {
      return this.parseCSVStudents(buffer.toString());
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error('Worksheet not found');

    const students: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      // Mapping for Dummy format: Student ID, Student Name, Student Email, ...
      const fullName = row.getCell(2).text;
      const email = row.getCell(3).text;
      const phone = row.getCell(10).text; // Optional

      if (email && fullName) {
        const [firstName, ...lastNames] = fullName.split(' ');
        students.push({ 
          email, 
          firstName, 
          lastName: lastNames.join(' ') || '.', 
          phone 
        });
      }
    });

    return students;
  }

  private parseCSVStudents(csvContent: string): any[] {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    const students: any[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      // Format: Student ID, Student Name, Student Email, ...
      const fullName = columns[1]?.trim();
      const email = columns[2]?.trim();
      const phone = columns[9]?.trim(); // Optional

      if (email && fullName) {
        const [firstName, ...lastNames] = fullName.split(' ');
        students.push({ 
          email, 
          firstName, 
          lastName: lastNames.join(' ') || '.', 
          phone 
        });
      }
    }
    return students;
  }

  async bulkAddStudentsToBatch(batchId: string, studentsData: any[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    const defaultPassword = await bcrypt.hash('student123', 10);

    for (const data of studentsData) {
      try {
        const existing = await this.userRepository.findOne({ where: { email: data.email } });
        if (existing) {
          existing.batchId = batchId;
          existing.status = UserStatus.ACTIVE;
          await this.userRepository.save(existing);
        } else {
          const user = this.userRepository.create({
            ...data,
            password: defaultPassword,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            batchId: batchId,
            isEmailVerified: true
          });
          await this.userRepository.save(user);
        }
        success++;
      } catch (err: any) {
        failed++;
        errors.push(`Error adding ${data.email}: ${err.message}`);
      }
    }

    return { success, failed, errors };
  }
}
