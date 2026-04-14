import { Repository, getRepository } from 'typeorm';
import { Test, Section, Subsection, TestQuestion, TestStatus, TestVisibility, ProctoringLevel } from './assessment.entity';

export interface TestRules {
  duration: number;
  shuffledQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowPause: boolean;
  allowFlag: boolean;
  showInstantResults: boolean;
  breakTime: number;
  allowCalculator: boolean;
  allowNotes: boolean;
}

export interface CreateTestDto {
  title: string;
  description?: string;
  visibility?: TestVisibility;
  accessCode?: string;
  duration?: number;
  shuffledQuestions?: boolean;
  shuffledOptions?: boolean;
  passingMarks?: number;
  proctoringLevel?: ProctoringLevel;
  restrictDevices?: boolean;
  restrictIP?: boolean;
  allowedIPs?: string;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  resultMessage?: string;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  maxAttempts?: number;
  institutionId?: string;
  courseId?: string;
  createdById?: string;
}

export interface CreateSectionDto {
  name: string;
  description?: string;
  order?: number;
  duration?: number;
  marks?: number;
  shuffledQuestions?: boolean;
  showResults?: boolean;
  sectionDuration?: number;
  sectionShowResults?: boolean;
  sectionShuffledQuestions?: boolean;
  sectionAllowPause?: boolean;
  sectionAllowFlag?: boolean;
  sectionShowInstantResults?: boolean;
  sectionBreakTime?: number;
  sectionAllowCalculator?: boolean;
  sectionAllowNotes?: boolean;
  sectionShowCorrectAnswers?: boolean;
  sectionQuestionDuration?: number;
  sectionQuestionShowResults?: boolean;
  sectionQuestionShowCorrectAnswers?: boolean;
  sectionQuestionAllowFlag?: boolean;
  sectionQuestionDefaultMarks?: number;
  testId: string;
}

export interface CreateSubsectionDto {
  name: string;
  description?: string;
  order?: number;
  duration?: number;
  marks?: number;
  shuffledQuestions?: boolean;
  showResults?: boolean;
  randomCutoff?: boolean;
  cutoffMarks?: number;
  subsectionDuration?: number;
  subsectionShowResults?: boolean;
  subsectionShuffledQuestions?: boolean;
  subsectionAllowPause?: boolean;
  subsectionAllowFlag?: boolean;
  subsectionShowInstantResults?: boolean;
  subsectionBreakTime?: number;
  subsectionAllowCalculator?: boolean;
  subsectionAllowNotes?: boolean;
  subsectionShowCorrectAnswers?: boolean;
  subsectionQuestionDuration?: number;
  subsectionQuestionShowResults?: boolean;
  subsectionQuestionShowCorrectAnswers?: boolean;
  subsectionQuestionAllowFlag?: boolean;
  subsectionQuestionDefaultMarks?: number;
  sectionId: string;
}

export interface TestFilterDto {
  status?: TestStatus;
  visibility?: TestVisibility;
  institutionId?: string;
  courseId?: string;
  createdById?: string;
  search?: string;
}

export class AssessmentService {
  constructor(
    private testRepository: Repository<Test>,
    private sectionRepository: Repository<Section>,
    private testQuestionRepository: Repository<TestQuestion>
  ) {}

  async createTest(createDto: CreateTestDto): Promise<Test> {
    const test = this.testRepository.create({
      ...createDto,
      status: TestStatus.DRAFT,
    });
    return this.testRepository.save(test);
  }

  async findAllTests(filter?: TestFilterDto): Promise<Test[]> {
    const query = this.testRepository.createQueryBuilder('test');

    if (filter?.status) {
      query.andWhere('test.status = :status', { status: filter.status });
    }
    if (filter?.visibility) {
      query.andWhere('test.visibility = :visibility', { visibility: filter.visibility });
    }
    if (filter?.institutionId) {
      query.andWhere('test.institutionId = :institutionId', { institutionId: filter.institutionId });
    }
    if (filter?.courseId) {
      query.andWhere('test.courseId = :courseId', { courseId: filter.courseId });
    }
    if (filter?.search) {
      query.andWhere('(test.title LIKE :search OR test.description LIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    return query.orderBy('test.createdAt', 'DESC').getMany();
  }

  async findTestById(id: string): Promise<Test | null> {
    return this.testRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  }

  async updateTest(id: string, updateData: Partial<Test>): Promise<Test | null> {
    await this.testRepository.update(id, updateData);
    return this.findTestById(id);
  }

  async deleteTest(id: string): Promise<void> {
    await this.testRepository.delete(id);
  }

  async publishTest(id: string): Promise<Test | null> {
    const test = await this.findTestById(id);
    if (!test) {
      throw new Error('Test not found');
    }
    if (!test.duration || test.duration <= 0) {
      throw new Error('Test must have a duration set before publishing');
    }
    
    // Auto-generate access code for PUBLIC visibility
    let accessCode = test.accessCode;
    if (test.visibility === TestVisibility.PUBLIC && !accessCode) {
      accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    await this.testRepository.update(id, { 
      status: TestStatus.PUBLISHED,
      accessCode: accessCode || undefined,
    });
    return this.findTestById(id);
  }

  async goLive(id: string): Promise<Test | null> {
    const test = await this.findTestById(id);
    if (!test) {
      throw new Error('Test not found');
    }
    
    // Allow goLive from PUBLISHED (go live) or PAUSED (resume)
    if (test.status !== TestStatus.PUBLISHED && test.status !== TestStatus.PAUSED) {
      throw new Error('Can only go live from published or paused status');
    }
    
    // Check schedule timing if scheduled
    if (test.startDate || test.endDate) {
      const now = new Date();
      const startDate = test.startDate ? new Date(test.startDate) : null;
      const endDate = test.endDate ? new Date(test.endDate) : null;
      
      if (startDate && now < startDate) {
        throw new Error('Cannot start/resume before scheduled start date');
      }
      
      if (endDate && now > endDate) {
        throw new Error('Cannot start/resume after scheduled end date');
      }
    }
    
    await this.testRepository.update(id, { status: TestStatus.LIVE });
    return this.findTestById(id);
  }

  async pauseTest(id: string): Promise<Test | null> {
    const test = await this.findTestById(id);
    if (!test) {
      throw new Error('Test not found');
    }
    
    if (test.status !== TestStatus.LIVE) {
      throw new Error('Can only pause a live test');
    }
    
    if (test.startDate || test.endDate) {
      const now = new Date();
      const endDate = test.endDate ? new Date(test.endDate) : null;
      
      if (endDate && now > endDate) {
        throw new Error('Cannot pause after scheduled end date');
      }
    }
    
    await this.testRepository.update(id, { status: TestStatus.PAUSED });
    return this.findTestById(id);
  }

  async completeTest(id: string): Promise<Test | null> {
    await this.testRepository.update(id, { status: TestStatus.COMPLETED });
    return this.findTestById(id);
  }

  async generateAccessCode(id: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await this.testRepository.update(id, { accessCode: code });
    return code;
  }

  async validateAccessCode(id: string, code: string): Promise<boolean> {
    const test = await this.findTestById(id);
    return test?.accessCode === code;
  }

  async createSection(createDto: CreateSectionDto): Promise<Section> {
    const maxOrder = await this.sectionRepository
      .createQueryBuilder('section')
      .where('section.testId = :testId', { testId: createDto.testId })
      .select('MAX(section.order)', 'max')
      .getRawOne();
    
    const section = this.sectionRepository.create({
      ...createDto,
      order: createDto.order ?? (maxOrder?.max ?? -1) + 1,
    });
    return this.sectionRepository.save(section);
  }

  async findSectionsByTest(testId: string): Promise<Section[]> {
    return this.sectionRepository.find({
      where: { testId },
      order: { order: 'ASC' },
    });
  }

  async updateSection(id: string, updateData: Partial<Section>): Promise<Section | null> {
    await this.sectionRepository.update(id, updateData);
    return this.sectionRepository.findOne({ where: { id } });
  }

  async deleteSection(id: string): Promise<void> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (section) {
      await this.sectionRepository.delete(id);
      await this.reorderSections(section.testId);
    }
  }

  private async reorderSections(testId: string): Promise<void> {
    const sections = await this.sectionRepository.find({
      where: { testId },
      order: { order: 'ASC' },
    });
    
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].order !== i) {
        await this.sectionRepository.update(sections[i].id, { order: i });
      }
    }
  }

  async createSubsection(createDto: CreateSubsectionDto): Promise<Subsection> {
    const subsectionRepo = getRepository(Subsection);
    const maxOrder = await subsectionRepo
      .createQueryBuilder('subsection')
      .where('subsection.sectionId = :sectionId', { sectionId: createDto.sectionId })
      .select('MAX(subsection.order)', 'max')
      .getRawOne();
    
    const subsection = subsectionRepo.create({
      ...createDto,
      order: createDto.order ?? (maxOrder?.max ?? -1) + 1,
    });
    return subsectionRepo.save(subsection);
  }

  async findSubsectionsBySection(sectionId: string): Promise<Subsection[]> {
    const subsectionRepo = getRepository(Subsection);
    return subsectionRepo.find({
      where: { sectionId },
      order: { order: 'ASC' },
    });
  }

  async updateSubsection(id: string, updateData: Partial<Subsection>): Promise<Subsection | null> {
    const subsectionRepo = getRepository(Subsection);
    await subsectionRepo.update(id, updateData);
    return subsectionRepo.findOne({ where: { id } });
  }

  async deleteSubsection(id: string): Promise<void> {
    const subsectionRepo = getRepository(Subsection);
    const subsection = await subsectionRepo.findOne({ where: { id } });
    if (subsection) {
      await subsectionRepo.delete(id);
      await this.reorderSubsections(subsection.sectionId);
    }
  }

  private async reorderSubsections(sectionId: string): Promise<void> {
    const subsections = await getRepository(Subsection).find({
      where: { sectionId },
      order: { order: 'ASC' },
    });
    
    for (let i = 0; i < subsections.length; i++) {
      if (subsections[i].order !== i) {
        await getRepository(Subsection).update(subsections[i].id, { order: i });
      }
    }
  }

  async addQuestionToTest(
    testId: string,
    questionId: string,
    sectionId?: string,
    subsectionId?: string,
    marks?: number,
    order?: number,
    questionSettings?: {
      questionDuration?: number;
      questionShowResults?: boolean;
      questionShowCorrectAnswers?: boolean;
      questionAllowFlag?: boolean;
      questionMarks?: number;
    }
  ): Promise<TestQuestion> {
    let questionOrder: number;
    
    if (order) {
      questionOrder = order;
    } else if (subsectionId) {
      const maxOrder = await this.testQuestionRepository
        .createQueryBuilder('tq')
        .where('tq.subsectionId = :subsectionId', { subsectionId })
        .select('MAX(tq.order)', 'max')
        .getRawOne();
      questionOrder = (maxOrder?.max ?? -1) + 1;
    } else if (sectionId) {
      const maxOrder = await this.testQuestionRepository
        .createQueryBuilder('tq')
        .where('tq.sectionId = :sectionId', { sectionId })
        .select('MAX(tq.order)', 'max')
        .getRawOne();
      questionOrder = (maxOrder?.max ?? -1) + 1;
    } else {
      const maxOrder = await this.testQuestionRepository
        .createQueryBuilder('tq')
        .where('tq.testId = :testId', { testId })
        .select('MAX(tq.order)', 'max')
        .getRawOne();
      questionOrder = (maxOrder?.max ?? -1) + 1;
    }

    const testQuestion = this.testQuestionRepository.create({
      testId,
      questionId,
      sectionId,
      subsectionId,
      marks: marks || 1,
      order: questionOrder,
      questionDuration: questionSettings?.questionDuration,
      questionShowResults: questionSettings?.questionShowResults,
      questionShowCorrectAnswers: questionSettings?.questionShowCorrectAnswers,
      questionAllowFlag: questionSettings?.questionAllowFlag,
      questionMarks: questionSettings?.questionMarks,
    });
    return this.testQuestionRepository.save(testQuestion);
  }

  async removeQuestionFromTest(testQuestionId: string): Promise<void> {
    const testQuestion = await this.testQuestionRepository.findOne({ 
      where: { id: testQuestionId },
      relations: ['section', 'subsection']
    });
    
    if (testQuestion) {
      const testId = testQuestion.testId;
      await this.testQuestionRepository.delete(testQuestionId);
      await this.reorderTestQuestions(testId, testQuestion.sectionId, testQuestion.subsectionId);
    }
  }

  private async reorderTestQuestions(testId: string, sectionId?: string, subsectionId?: string): Promise<void> {
    let questions: TestQuestion[];
    
    if (subsectionId) {
      questions = await this.testQuestionRepository.find({
        where: { subsectionId },
        order: { order: 'ASC' },
      });
    } else if (sectionId) {
      questions = await this.testQuestionRepository.find({
        where: { sectionId, subsectionId: null },
        order: { order: 'ASC' },
      });
    } else {
      questions = await this.testQuestionRepository.find({
        where: { testId, sectionId: null, subsectionId: null },
        order: { order: 'ASC' },
      });
    }
    
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].order !== i) {
        await this.testQuestionRepository.update(questions[i].id, { order: i });
      }
    }
  }

  async getTestQuestions(testId: string): Promise<TestQuestion[]> {
    return this.testQuestionRepository.find({
      where: { testId },
      order: { order: 'ASC' },
      relations: ['question'],
    });
  }

  async getTestSections(testId: string): Promise<Section[]> {
    return this.findSectionsByTest(testId);
  }

  async cloneTest(testId: string, newTitle: string): Promise<Test> {
    const originalTest = await this.findTestById(testId);
    if (!originalTest) {
      throw new Error('Test not found');
    }

    const newTest = this.testRepository.create({
      ...originalTest,
      id: undefined,
      title: newTitle,
      status: TestStatus.DRAFT,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.testRepository.save(newTest);
  }

  async getTestRules(testId: string): Promise<TestRules> {
    const test = await this.findTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }
    return {
      duration: test.duration,
      shuffledQuestions: test.shuffledQuestions,
      showResults: test.showResults,
      showCorrectAnswers: test.showCorrectAnswers,
      allowPause: test.allowPause,
      allowFlag: test.allowFlag,
      showInstantResults: test.showInstantResults,
      breakTime: test.breakTime,
      allowCalculator: test.allowCalculator,
      allowNotes: test.allowNotes,
    };
  }

  async getEffectiveRulesForSection(sectionId: string): Promise<TestRules> {
    const sectionRepo = getRepository(Section);
    const subsectionRepo = getRepository(Subsection);
    
    const section = await sectionRepo.findOne({
      where: { id: sectionId },
      relations: ['test'],
    });
    
    if (!section || !section.test) {
      throw new Error('Section or test not found');
    }
    
    const test = section.test;
    
    // Check if section has subsections
    const subsections = await subsectionRepo.find({
      where: { sectionId },
      order: { order: 'ASC' },
      take: 1,
    });
    
    // If section has subsections, use first subsection's settings as defaults
    // Otherwise use test settings as defaults
    const defaultSource = subsections.length > 0 ? subsections[0] : null;
    
    return {
      duration: section.sectionDuration ?? defaultSource?.subsectionDuration ?? test.duration,
      shuffledQuestions: section.sectionShuffledQuestions ?? defaultSource?.subsectionShuffledQuestions ?? test.shuffledQuestions,
      showResults: section.sectionShowResults ?? defaultSource?.subsectionShowResults ?? test.showResults,
      showCorrectAnswers: section.sectionShowCorrectAnswers ?? defaultSource?.subsectionShowCorrectAnswers ?? test.showCorrectAnswers,
      allowPause: section.sectionAllowPause ?? defaultSource?.subsectionAllowPause ?? test.allowPause,
      allowFlag: section.sectionAllowFlag ?? defaultSource?.subsectionAllowFlag ?? test.allowFlag,
      showInstantResults: section.sectionShowInstantResults ?? defaultSource?.subsectionShowInstantResults ?? test.showInstantResults,
      breakTime: section.sectionBreakTime ?? defaultSource?.subsectionBreakTime ?? test.breakTime,
      allowCalculator: section.sectionAllowCalculator ?? defaultSource?.subsectionAllowCalculator ?? test.allowCalculator,
      allowNotes: section.sectionAllowNotes ?? defaultSource?.subsectionAllowNotes ?? test.allowNotes,
    };
  }

  async getEffectiveRulesForSubsection(subsectionId: string): Promise<TestRules> {
    const subsectionRepo = getRepository(Subsection);
    const sectionRepo = getRepository(Section);
    const testRepo = getRepository(Test);
    
    const subsection = await subsectionRepo.findOne({
      where: { id: subsectionId },
      relations: ['section', 'section.test'],
    });
    
    if (!subsection || !subsection.section || !subsection.section.test) {
      throw new Error('Subsection, section, or test not found');
    }
    
    const section = subsection.section;
    const test = section.test;
    
    return {
      duration: subsection.subsectionDuration ?? section.sectionDuration ?? test.duration,
      shuffledQuestions: subsection.subsectionShuffledQuestions ?? section.sectionShuffledQuestions ?? test.shuffledQuestions,
      showResults: subsection.subsectionShowResults ?? section.sectionShowResults ?? test.showResults,
      showCorrectAnswers: subsection.subsectionShowCorrectAnswers ?? section.sectionShowCorrectAnswers ?? test.showCorrectAnswers,
      allowPause: subsection.subsectionAllowPause ?? section.sectionAllowPause ?? test.allowPause,
      allowFlag: subsection.subsectionAllowFlag ?? section.sectionAllowFlag ?? test.allowFlag,
      showInstantResults: subsection.subsectionShowInstantResults ?? section.sectionShowInstantResults ?? test.showInstantResults,
      breakTime: subsection.subsectionBreakTime ?? section.sectionBreakTime ?? test.breakTime,
      allowCalculator: subsection.subsectionAllowCalculator ?? section.sectionAllowCalculator ?? test.allowCalculator,
      allowNotes: subsection.subsectionAllowNotes ?? section.sectionAllowNotes ?? test.allowNotes,
    };
  }

  async getSectionSettingsWithInheritance(sectionId: string): Promise<any> {
    const sectionRepo = getRepository(Section);
    const testRepo = getRepository(Test);
    
    const section = await sectionRepo.findOne({
      where: { id: sectionId },
      relations: ['test'],
    });
    
    if (!section || !section.test) {
      throw new Error('Section or test not found');
    }
    
    const test = section.test;
    
    const effectiveSettings = {
      duration: {
        value: section.sectionDuration ?? test.duration,
        source: section.sectionDuration !== null && section.sectionDuration !== undefined ? 'section' : 'test',
        isOverridden: section.sectionDuration !== null && section.sectionDuration !== undefined,
        testValue: test.duration,
      },
      showResults: {
        value: section.sectionShowResults ?? test.showResults,
        source: section.sectionShowResults !== null && section.sectionShowResults !== undefined ? 'section' : 'test',
        isOverridden: section.sectionShowResults !== null && section.sectionShowResults !== undefined,
        testValue: test.showResults,
      },
      showCorrectAnswers: {
        value: section.sectionShowCorrectAnswers ?? test.showCorrectAnswers,
        source: section.sectionShowCorrectAnswers !== null && section.sectionShowCorrectAnswers !== undefined ? 'section' : 'test',
        isOverridden: section.sectionShowCorrectAnswers !== null && section.sectionShowCorrectAnswers !== undefined,
        testValue: test.showCorrectAnswers,
      },
      allowPause: {
        value: section.sectionAllowPause ?? test.allowPause,
        source: section.sectionAllowPause !== null && section.sectionAllowPause !== undefined ? 'section' : 'test',
        isOverridden: section.sectionAllowPause !== null && section.sectionAllowPause !== undefined,
        testValue: test.allowPause,
      },
      allowFlag: {
        value: section.sectionAllowFlag ?? test.allowFlag,
        source: section.sectionAllowFlag !== null && section.sectionAllowFlag !== undefined ? 'section' : 'test',
        isOverridden: section.sectionAllowFlag !== null && section.sectionAllowFlag !== undefined,
        testValue: test.allowFlag,
      },
      showInstantResults: {
        value: section.sectionShowInstantResults ?? test.showInstantResults,
        source: section.sectionShowInstantResults !== null && section.sectionShowInstantResults !== undefined ? 'section' : 'test',
        isOverridden: section.sectionShowInstantResults !== null && section.sectionShowInstantResults !== undefined,
        testValue: test.showInstantResults,
      },
      breakTime: {
        value: section.sectionBreakTime ?? test.breakTime,
        source: section.sectionBreakTime !== null && section.sectionBreakTime !== undefined ? 'section' : 'test',
        isOverridden: section.sectionBreakTime !== null && section.sectionBreakTime !== undefined,
        testValue: test.breakTime,
      },
      allowCalculator: {
        value: section.sectionAllowCalculator ?? test.allowCalculator,
        source: section.sectionAllowCalculator !== null && section.sectionAllowCalculator !== undefined ? 'section' : 'test',
        isOverridden: section.sectionAllowCalculator !== null && section.sectionAllowCalculator !== undefined,
        testValue: test.allowCalculator,
      },
      allowNotes: {
        value: section.sectionAllowNotes ?? test.allowNotes,
        source: section.sectionAllowNotes !== null && section.sectionAllowNotes !== undefined ? 'section' : 'test',
        isOverridden: section.sectionAllowNotes !== null && section.sectionAllowNotes !== undefined,
        testValue: test.allowNotes,
      },
      questionDuration: {
        value: section.sectionQuestionDuration ?? null,
        source: section.sectionQuestionDuration !== null && section.sectionQuestionDuration !== undefined ? 'section' : 'test',
        isOverridden: section.sectionQuestionDuration !== null && section.sectionQuestionDuration !== undefined,
        testValue: null,
      },
      questionDefaultMarks: {
        value: section.sectionQuestionDefaultMarks ?? null,
        source: section.sectionQuestionDefaultMarks !== null && section.sectionQuestionDefaultMarks !== undefined ? 'section' : 'test',
        isOverridden: section.sectionQuestionDefaultMarks !== null && section.sectionQuestionDefaultMarks !== undefined,
        testValue: null,
      },
    };
    
    return {
      section,
      test,
      effectiveSettings,
    };
  }

  async getSubsectionSettingsWithInheritance(subsectionId: string): Promise<any> {
    const subsectionRepo = getRepository(Subsection);
    
    const subsection = await subsectionRepo.findOne({
      where: { id: subsectionId },
      relations: ['section', 'section.test'],
    });
    
    if (!subsection || !subsection.section || !subsection.section.test) {
      throw new Error('Subsection, section, or test not found');
    }
    
    const section = subsection.section;
    const test = section.test;
    
    const effectiveSettings = {
      duration: {
        value: subsection.subsectionDuration ?? section.sectionDuration ?? test.duration,
        source: subsection.subsectionDuration !== null && subsection.subsectionDuration !== undefined ? 'subsection' :
                section.sectionDuration !== null && section.sectionDuration !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionDuration !== null && subsection.subsectionDuration !== undefined,
        testValue: test.duration,
        sectionValue: section.sectionDuration,
      },
      showResults: {
        value: subsection.subsectionShowResults ?? section.sectionShowResults ?? test.showResults,
        source: subsection.subsectionShowResults !== null && subsection.subsectionShowResults !== undefined ? 'subsection' :
                section.sectionShowResults !== null && section.sectionShowResults !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionShowResults !== null && subsection.subsectionShowResults !== undefined,
        testValue: test.showResults,
        sectionValue: section.sectionShowResults,
      },
      showCorrectAnswers: {
        value: subsection.subsectionShowCorrectAnswers ?? section.sectionShowCorrectAnswers ?? test.showCorrectAnswers,
        source: subsection.subsectionShowCorrectAnswers !== null && subsection.subsectionShowCorrectAnswers !== undefined ? 'subsection' :
                section.sectionShowCorrectAnswers !== null && section.sectionShowCorrectAnswers !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionShowCorrectAnswers !== null && subsection.subsectionShowCorrectAnswers !== undefined,
        testValue: test.showCorrectAnswers,
        sectionValue: section.sectionShowCorrectAnswers,
      },
      allowPause: {
        value: subsection.subsectionAllowPause ?? section.sectionAllowPause ?? test.allowPause,
        source: subsection.subsectionAllowPause !== null && subsection.subsectionAllowPause !== undefined ? 'subsection' :
                section.sectionAllowPause !== null && section.sectionAllowPause !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionAllowPause !== null && subsection.subsectionAllowPause !== undefined,
        testValue: test.allowPause,
        sectionValue: section.sectionAllowPause,
      },
      allowFlag: {
        value: subsection.subsectionAllowFlag ?? section.sectionAllowFlag ?? test.allowFlag,
        source: subsection.subsectionAllowFlag !== null && subsection.subsectionAllowFlag !== undefined ? 'subsection' :
                section.sectionAllowFlag !== null && section.sectionAllowFlag !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionAllowFlag !== null && subsection.subsectionAllowFlag !== undefined,
        testValue: test.allowFlag,
        sectionValue: section.sectionAllowFlag,
      },
      showInstantResults: {
        value: subsection.subsectionShowInstantResults ?? section.sectionShowInstantResults ?? test.showInstantResults,
        source: subsection.subsectionShowInstantResults !== null && subsection.subsectionShowInstantResults !== undefined ? 'subsection' :
                section.sectionShowInstantResults !== null && section.sectionShowInstantResults !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionShowInstantResults !== null && subsection.subsectionShowInstantResults !== undefined,
        testValue: test.showInstantResults,
        sectionValue: section.sectionShowInstantResults,
      },
      breakTime: {
        value: subsection.subsectionBreakTime ?? section.sectionBreakTime ?? test.breakTime,
        source: subsection.subsectionBreakTime !== null && subsection.subsectionBreakTime !== undefined ? 'subsection' :
                section.sectionBreakTime !== null && section.sectionBreakTime !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionBreakTime !== null && subsection.subsectionBreakTime !== undefined,
        testValue: test.breakTime,
        sectionValue: section.sectionBreakTime,
      },
      allowCalculator: {
        value: subsection.subsectionAllowCalculator ?? section.sectionAllowCalculator ?? test.allowCalculator,
        source: subsection.subsectionAllowCalculator !== null && subsection.subsectionAllowCalculator !== undefined ? 'subsection' :
                section.sectionAllowCalculator !== null && section.sectionAllowCalculator !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionAllowCalculator !== null && subsection.subsectionAllowCalculator !== undefined,
        testValue: test.allowCalculator,
        sectionValue: section.sectionAllowCalculator,
      },
      allowNotes: {
        value: subsection.subsectionAllowNotes ?? section.sectionAllowNotes ?? test.allowNotes,
        source: subsection.subsectionAllowNotes !== null && subsection.subsectionAllowNotes !== undefined ? 'subsection' :
                section.sectionAllowNotes !== null && section.sectionAllowNotes !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionAllowNotes !== null && subsection.subsectionAllowNotes !== undefined,
        testValue: test.allowNotes,
        sectionValue: section.sectionAllowNotes,
      },
      questionDuration: {
        value: subsection.subsectionQuestionDuration ?? section.sectionQuestionDuration ?? null,
        source: subsection.subsectionQuestionDuration !== null && subsection.subsectionQuestionDuration !== undefined ? 'subsection' :
                section.sectionQuestionDuration !== null && section.sectionQuestionDuration !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionQuestionDuration !== null && subsection.subsectionQuestionDuration !== undefined,
        testValue: null,
        sectionValue: section.sectionQuestionDuration,
      },
      questionDefaultMarks: {
        value: subsection.subsectionQuestionDefaultMarks ?? section.sectionQuestionDefaultMarks ?? null,
        source: subsection.subsectionQuestionDefaultMarks !== null && subsection.subsectionQuestionDefaultMarks !== undefined ? 'subsection' :
                section.sectionQuestionDefaultMarks !== null && section.sectionQuestionDefaultMarks !== undefined ? 'section' : 'test',
        isOverridden: subsection.subsectionQuestionDefaultMarks !== null && subsection.subsectionQuestionDefaultMarks !== undefined,
        testValue: null,
        sectionValue: section.sectionQuestionDefaultMarks,
      },
    };
    
    return {
      subsection,
      section,
      test,
      effectiveSettings,
    };
  }

  async getTestWithSections(testId: string): Promise<any> {
    const test = await this.findTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    const sections = await this.findSectionsByTest(testId);
    const sectionRepo = getRepository(Section);
    const subsectionRepo = getRepository(Subsection);

    const sectionsWithSubsections = await Promise.all(
      sections.map(async (section) => {
        const subsections = await subsectionRepo.find({
          where: { sectionId: section.id },
          order: { order: 'ASC' },
        });
        return { ...section, subsections };
      })
    );

    return { ...test, sections: sectionsWithSubsections };
  }

  async getEffectiveQuestionRulesForTestQuestion(testQuestionId: string): Promise<QuestionRules> {
    const testQuestionRepo = getRepository(TestQuestion);
    
    const testQuestion = await testQuestionRepo.findOne({
      where: { id: testQuestionId },
      relations: ['subsection', 'subsection.section', 'subsection.section.test', 'section', 'section.test'],
    });
    
    if (!testQuestion) {
      throw new Error('Test question not found');
    }

    const subsection = testQuestion.subsection;
    const section = testQuestion.section;
    const test = subsection?.section?.test || section?.test;

    return {
      duration: testQuestion.questionDuration ?? subsection?.subsectionQuestionDuration ?? section?.sectionQuestionDuration ?? null,
      showResults: testQuestion.questionShowResults ?? subsection?.subsectionQuestionShowResults ?? section?.sectionQuestionShowResults ?? test?.showResults ?? true,
      showCorrectAnswers: testQuestion.questionShowCorrectAnswers ?? subsection?.subsectionQuestionShowCorrectAnswers ?? section?.sectionQuestionShowCorrectAnswers ?? test?.showCorrectAnswers ?? true,
      allowFlag: testQuestion.questionAllowFlag ?? subsection?.subsectionQuestionAllowFlag ?? section?.sectionQuestionAllowFlag ?? test?.allowFlag ?? true,
      marks: testQuestion.questionMarks ?? subsection?.subsectionQuestionDefaultMarks ?? section?.sectionQuestionDefaultMarks ?? testQuestion.marks ?? 1,
    };
  }

  async calculateSubsectionTotals(subsectionId: string): Promise<{ marks: number; duration: number }> {
    const subsectionRepo = getRepository(Subsection);
    const testQuestionRepo = getRepository(TestQuestion);
    
    const subsection = await subsectionRepo.findOne({
      where: { id: subsectionId },
      relations: ['section', 'section.test'],
    });
    
    if (!subsection) {
      throw new Error('Subsection not found');
    }
    
    const testQuestions = await testQuestionRepo.find({
      where: { subsectionId },
      relations: ['question'],
    });
    
    let marks = 0;
    let duration = 0;
    
    for (const tq of testQuestions) {
      marks += tq.questionMarks ?? tq.marks ?? 1;
      if (tq.questionDuration) {
        duration += tq.questionDuration;
      } else if (subsection.subsectionQuestionDuration) {
        duration += subsection.subsectionQuestionDuration;
      } else if (subsection.section?.sectionQuestionDuration) {
        duration += subsection.section.sectionQuestionDuration;
      } else {
        duration += subsection.section?.test?.duration ?? 0;
      }
    }
    
    return { marks, duration };
  }

  async calculateSectionTotals(sectionId: string): Promise<{ marks: number; duration: number; subsections: any[] }> {
    const sectionRepo = getRepository(Section);
    const subsectionRepo = getRepository(Subsection);
    const testQuestionRepo = getRepository(TestQuestion);
    
    const section = await sectionRepo.findOne({
      where: { id: sectionId },
      relations: ['test'],
    });
    
    if (!section) {
      throw new Error('Section not found');
    }
    
    const subsections = await subsectionRepo.find({
      where: { sectionId },
      order: { order: 'ASC' },
    });
    
    let totalMarks = 0;
    let totalDuration = 0;
    const subsectionTotals: any[] = [];
    
    for (const sub of subsections) {
      const subQuestions = await testQuestionRepo.find({
        where: { subsectionId: sub.id },
      });
      
      let subMarks = 0;
      let subDuration = 0;
      
      for (const tq of subQuestions) {
        subMarks += tq.questionMarks ?? tq.marks ?? 1;
        if (tq.questionDuration) {
          subDuration += tq.questionDuration;
        } else if (sub.subsectionQuestionDuration) {
          subDuration += sub.subsectionQuestionDuration;
        } else if (section.sectionQuestionDuration) {
          subDuration += section.sectionQuestionDuration;
        } else {
          subDuration += section.test?.duration ?? 0;
        }
      }
      
      if (subQuestions.length === 0 && sub.marks) {
        subMarks = Number(sub.marks);
      }
      if (subQuestions.length === 0 && sub.duration) {
        subDuration = sub.duration;
      }
      
      totalMarks += subMarks;
      totalDuration += subDuration;
      subsectionTotals.push({
        id: sub.id,
        name: sub.name,
        marks: subMarks,
        duration: subDuration,
        questionCount: subQuestions.length,
      });
    }
    
    const directQuestions = await testQuestionRepo.find({
      where: { sectionId, subsectionId: null },
    });
    
    for (const tq of directQuestions) {
      totalMarks += tq.questionMarks ?? tq.marks ?? 1;
      if (tq.questionDuration) {
        totalDuration += tq.questionDuration;
      } else if (section.sectionQuestionDuration) {
        totalDuration += section.sectionQuestionDuration;
      } else {
        totalDuration += section.test?.duration ?? 0;
      }
    }
    
    if (directQuestions.length === 0 && section.marks) {
      totalMarks = Number(section.marks);
    }
    if (directQuestions.length === 0 && section.duration) {
      totalDuration = section.duration;
    }
    
    return { 
      marks: totalMarks, 
      duration: totalDuration,
      subsections: subsectionTotals,
    };
  }

  async calculateTestTotals(testId: string): Promise<{
    totalMarks: number;
    totalDuration: number;
    sectionTotals: any[];
  }> {
    const test = await this.findTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }
    
    const sections = await this.findSectionsByTest(testId);
    
    let totalMarks = 0;
    let totalDuration = 0;
    const sectionTotals: any[] = [];
    
    for (const section of sections) {
      const sectionData = await this.calculateSectionTotals(section.id);
      
      let sectionMarks = sectionData.marks;
      let sectionDuration = sectionData.duration;
      
      if (section.marks && !isNaN(Number(section.marks))) {
        sectionMarks = Number(section.marks);
      }
      if (section.duration && section.duration > 0) {
        sectionDuration = section.duration;
      }
      
      totalMarks += sectionMarks;
      totalDuration += sectionDuration;
      
      sectionTotals.push({
        id: section.id,
        name: section.name,
        marks: sectionMarks,
        duration: sectionDuration,
        questionCount: sectionData.subsections.reduce((sum, sub) => sum + sub.questionCount, 0),
        subsections: sectionData.subsections,
      });
    }
    
    const directQuestions = await this.testQuestionRepository.find({
      where: { testId, sectionId: null, subsectionId: null },
    });
    
    for (const tq of directQuestions) {
      totalMarks += tq.questionMarks ?? tq.marks ?? 1;
      if (tq.questionDuration) {
        totalDuration += tq.questionDuration;
      } else {
        totalDuration += test.duration;
      }
    }
    
    return {
      totalMarks,
      totalDuration,
      sectionTotals,
    };
  }

  async getScoreDistribution(testId: string): Promise<{
    average: number;
    highest: number;
    lowest: number;
    passingCount: number;
    failingCount: number;
    distribution: { range: string; count: number }[];
  }> {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      passingCount: 0,
      failingCount: 0,
      distribution: [],
    };
  }

  async getQuestionAnalytics(testId: string): Promise<{
    questionId: string;
    correctCount: number;
    incorrectCount: number;
    skipCount: number;
    averageTime: number;
  }[]> {
    return [];
  }

  async getStudentPerformance(testId: string, studentId: string): Promise<{
    studentId: string;
    score: number;
    percentage: number;
    timeTaken: number;
    startedAt: Date;
    completedAt: Date;
    answers: any[];
  } | null> {
    return null;
  }

  async sendResultEmail(testId: string, studentId: string): Promise<boolean> {
    return true;
  }

  async createInvitation(testId: string, email: string): Promise<{ accessCode: string; expiresAt: Date }> {
    const test = await this.findTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return { accessCode, expiresAt };
  }
}

export interface QuestionRules {
  duration: number | null;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowFlag: boolean;
  marks: number;
}