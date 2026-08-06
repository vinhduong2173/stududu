import { QuestionType } from '@prisma/client';
import { QuestionValidatorService } from './question-validator.service';

// BR-55: câu AI sinh và câu nhập tay đi qua ĐÚNG bộ validate này — test ở đây
// chính là test cho cả hai nguồn.
describe('QuestionValidatorService', () => {
  const validator = new QuestionValidatorService();

  const validQuestion = {
    type: QuestionType.vocabulary,
    term: 'cat',
    passage: null,
    prompt: 'Từ "cat" nghĩa là gì?',
    options: ['con mèo', 'con chó', 'con gà', 'con vịt'],
    answerIndex: 0,
    explanation: 'cat = con mèo',
  };

  it('chấp nhận câu hợp lệ', () => {
    const { question, errors } = validator.validateOne(validQuestion);
    expect(errors).toEqual([]);
    expect(question?.prompt).toBe('Từ "cat" nghĩa là gì?');
  });

  it('chặn khi không đủ 4 đáp án', () => {
    const { errors } = validator.validateOne({
      ...validQuestion,
      options: ['a', 'b', 'c'],
    });
    expect(errors.join(' ')).toContain('đúng 4 đáp án');
  });

  it('chặn khi hai đáp án trùng nội dung', () => {
    const { errors } = validator.validateOne({
      ...validQuestion,
      options: ['con mèo', 'con mèo', 'con gà', 'con vịt'],
    });
    expect(errors.join(' ')).toContain('trùng nội dung');
  });

  it('chặn khi answerIndex nằm ngoài 0..3', () => {
    const { errors } = validator.validateOne({
      ...validQuestion,
      answerIndex: 4,
    });
    expect(errors.join(' ')).toContain('từ 0 đến 3');
  });

  it('bắt buộc term với câu vocabulary', () => {
    const { errors } = validator.validateOne({ ...validQuestion, term: null });
    expect(errors.join(' ')).toContain('term');
  });

  it('bắt buộc passage với câu cloze/reading', () => {
    const { errors } = validator.validateOne({
      ...validQuestion,
      type: QuestionType.reading,
      term: null,
      passage: null,
    });
    expect(errors.join(' ')).toContain('passage');
  });

  it('chặn câu trùng với câu đã có trong bộ', () => {
    const { errors } = validator.validateOne(validQuestion, [
      'Từ "cat" nghĩa là gì?',
    ]);
    expect(errors.join(' ')).toContain('trùng');
  });

  it('bắt trùng giữa các câu trong cùng một lô dry-run', () => {
    const result = validator.dryRun([validQuestion, { ...validQuestion }]);
    expect(result.validCount).toBe(1);
    expect(result.errorCount).toBe(1);
  });

  it('dry-run giữ nguyên bản thô của dòng lỗi để FE hiển thị', () => {
    const bad = { ...validQuestion, options: ['a'] };
    const result = validator.dryRun([bad]);
    expect(result.rows[0].valid).toBe(false);
    expect(result.rows[0].raw).toBe(bad);
    expect(result.rows[0].question).toBeNull();
  });
});
