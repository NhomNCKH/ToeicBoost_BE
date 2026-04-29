export enum SkillTaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ToeicWritingTaskType {
  PART1_SENTENCE = 'part1_sentence',
  PART2_EMAIL = 'part2_email',
  PART3_ESSAY = 'part3_essay',
}

export enum ToeicSpeakingTaskType {
  READ_ALOUD = 'read_aloud',
  DESCRIBE_PICTURE = 'describe_picture',
  /** Q4–Q6: Respond to questions (3 questions) */
  EXPRESS_OPINION = 'express_opinion',
  RESPOND_TO_QUESTIONS = 'respond_to_questions',
  /** Q7–Q9: Respond using information (schedule/advertisement/notice) */
  RESPOND_USING_INFO = 'respond_using_info',
  /** Q11: Respond to a single question */
  RESPOND_TO_QUESTION = 'respond_to_question',
}

