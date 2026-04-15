import 'reflect-metadata';
import { initializeDatabase, AppDataSource } from './src/config/database';
import { AssignmentService } from './src/modules/modules/assignment/assignment.service';
import { AssignmentSubmission } from './src/modules/modules/assignment/assignment.entity';

async function test() {
  await initializeDatabase();
  const ds = AppDataSource;
  const assignmentService = new AssignmentService(
    ds.getRepository('Assignment'),
    ds.getRepository('AssignmentSubmission'),
    ds.getRepository('AssignmentQuestion'),
    ds.getRepository('User')
  );
  
  const subs = await assignmentService.getStudentSubmissions('09364476-f69a-4be3-a73e-1588c4deccb0');
  console.log('Submissions found:', subs.length);
  subs.forEach(s => console.log('- Assignment:', s.assignment?.title, 'Status:', s.status));
  process.exit(0);
}

test();
