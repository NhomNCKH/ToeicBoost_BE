/**
 * Nội dung mẫu phong cách TOEIC (P5 incomplete sentence, P6 text completion, P7 reading).
 * Viết lại học thuật — không trích từ đề ETS có bản quyền.
 */

export type McqDef = {
  prompt: string;
  answerKey: 'A' | 'B' | 'C' | 'D';
  options: [string, string, string, string];
  rationale?: string;
};

/** Trộn đáp án đúng vào đúng vị trí A–D theo answerKey */
export function optionsWithKey(
  answerKey: McqDef['answerKey'],
  texts: [string, string, string, string],
): { key: string; content: string; isCorrect: boolean }[] {
  const order: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const correctIdx = order.indexOf(answerKey);
  return order.map((k, i) => ({
    key: k,
    content: texts[i],
    isCorrect: i === correctIdx,
  }));
}

/** P5: 30 câu — mỗi câu một nhóm (1 question / group) */
export function buildP5Items(): McqDef[] {
  const templates: McqDef[] = [
    {
      prompt:
        'The contract will be ------- next Monday unless we receive written objections.',
      answerKey: 'B',
      options: ['finalize', 'finalized', 'finalizing', 'finalization'],
      rationale: 'Passive voice with “be + past participle”.',
    },
    {
      prompt:
        'Ms. Rivera asked her assistant to ------- the figures before the board meeting.',
      answerKey: 'A',
      options: ['verify', 'verity', 'verifiable', 'verification'],
    },
    {
      prompt:
        'Inventory levels are ------- lower than they were at this time last year.',
      answerKey: 'C',
      options: ['significance', 'significant', 'significantly', 'signify'],
    },
    {
      prompt:
        'The marketing team is ------- a survey to measure customer satisfaction.',
      answerKey: 'B',
      options: ['conduct', 'conducting', 'conducted', 'conductive'],
    },
    {
      prompt:
        'Please ------- that all visitors sign in at the reception desk.',
      answerKey: 'D',
      options: ['certain', 'certainly', 'certainty', 'ensure'],
    },
    {
      prompt:
        'The factory upgrade is expected to ------- production capacity by 12%.',
      answerKey: 'A',
      options: ['increase', 'increasing', 'increased', 'increasingly'],
    },
    {
      prompt:
        'Applicants must have at least three years of ------- experience in logistics.',
      answerKey: 'C',
      options: ['relate', 'relating', 'related', 'relation'],
    },
    {
      prompt:
        'The deadline for submitting proposals has been ------- to March 15.',
      answerKey: 'B',
      options: ['extend', 'extended', 'extending', 'extension'],
    },
    {
      prompt:
        'The committee will not reach a decision ------- it reviews the audit report.',
      answerKey: 'D',
      options: ['during', 'while', 'whenever', 'until'],
    },
    {
      prompt:
        'All employees are required to comply ------- the new safety guidelines.',
      answerKey: 'A',
      options: ['with', 'for', 'on', 'at'],
    },
  ];

  const extra: McqDef[] = [
    {
      prompt: 'The report is ------- for internal use only.',
      answerKey: 'B',
      options: ['intend', 'intended', 'intending', 'intention'],
    },
    {
      prompt: 'We need to ------- the risks before expanding overseas.',
      answerKey: 'A',
      options: ['assess', 'assessing', 'assessed', 'assessment'],
    },
    {
      prompt: 'The software update will be ------- automatically tonight.',
      answerKey: 'C',
      options: ['install', 'installing', 'installed', 'installs'],
    },
    {
      prompt: 'Please ------- your supervisor if you will be absent.',
      answerKey: 'D',
      options: ['notification', 'notified', 'notifies', 'notify'],
    },
    {
      prompt: 'The venue can ------- up to 200 guests.',
      answerKey: 'B',
      options: ['accommodation', 'accommodate', 'accommodating', 'accommodated'],
    },
    {
      prompt: 'Costs are likely to ------- unless we negotiate a discount.',
      answerKey: 'A',
      options: ['rise', 'rose', 'risen', 'rising'],
    },
    {
      prompt: 'The board ------- the proposal after a lengthy discussion.',
      answerKey: 'C',
      options: ['reject', 'rejecting', 'rejected', 'rejection'],
    },
    {
      prompt: 'Employees must wear ID badges ------- entering the building.',
      answerKey: 'D',
      options: ['while', 'during', 'whenever', 'upon'],
    },
    {
      prompt: 'The new policy aims to ------- workplace flexibility.',
      answerKey: 'B',
      options: ['promotion', 'promote', 'promoting', 'promoted'],
    },
    {
      prompt: 'We apologize for any ------- caused by the delay.',
      answerKey: 'A',
      options: ['inconvenience', 'inconvenient', 'inconveniently', 'inconveniences'],
    },
    {
      prompt: 'The technician is ------- the network for security issues.',
      answerKey: 'C',
      options: ['scan', 'scanned', 'scanning', 'scanner'],
    },
    {
      prompt: 'The results were ------- than we had anticipated.',
      answerKey: 'D',
      options: ['good', 'well', 'best', 'better'],
    },
    {
      prompt: 'Please submit your request ------- the end of the month.',
      answerKey: 'A',
      options: ['before', 'after', 'during', 'within'],
    },
    {
      prompt: 'The company will not be responsible ------- lost items.',
      answerKey: 'B',
      options: ['on', 'for', 'at', 'to'],
    },
    {
      prompt: 'Training sessions will be held on a ------- basis.',
      answerKey: 'C',
      options: ['week', 'weekly', 'weeks', 'weeklies'],
    },
    {
      prompt: 'The product launch was ------- due to supply chain issues.',
      answerKey: 'D',
      options: ['postpone', 'postpones', 'postponing', 'postponed'],
    },
    {
      prompt: 'We are looking for a candidate who is ------- with Excel.',
      answerKey: 'A',
      options: ['proficient', 'proficiency', 'proficiently', 'proficientness'],
    },
    {
      prompt: 'The client agreed to extend the ------- by two weeks.',
      answerKey: 'B',
      options: ['dead', 'deadline', 'deadly', 'deaden'],
    },
    {
      prompt: 'All invoices must be ------- within 30 days.',
      answerKey: 'C',
      options: ['pay', 'paying', 'paid', 'pays'],
    },
    {
      prompt: 'The committee will meet ------- to discuss the budget.',
      answerKey: 'D',
      options: ['week', 'weekly', 'weeks', 'tomorrow'],
    },
  ];

  const bulkP5More: McqDef[] = [
    {
      prompt:
        'The revised handbook will be ------- to all departments by March 1.',
      answerKey: 'B',
      options: ['distribute', 'distributed', 'distributing', 'distribution'],
    },
    {
      prompt: 'We expect the new line to ------- strong interest among retailers.',
      answerKey: 'A',
      options: ['generate', 'generous', 'generating', 'generative'],
    },
    {
      prompt: 'The auditor found no ------- discrepancies in the quarterly accounts.',
      answerKey: 'C',
      options: ['significantly', 'signify', 'significant', 'signified'],
    },
    {
      prompt: 'Please ------- your badge when you exit the secure area.',
      answerKey: 'A',
      options: ['return', 'returned', 'returning', 'returns'],
    },
    {
      prompt: 'The keynote will begin ------- at 9:00 A.M.; late seating is limited.',
      answerKey: 'A',
      options: ['promptly', 'prompt', 'promptness', 'prompted'],
    },
    {
      prompt: 'Ms. Nguyen is ------- regarded as an expert in supply chain analytics.',
      answerKey: 'B',
      options: ['wide', 'widely', 'width', 'widening'],
    },
    {
      prompt: 'The facility complies ------- all federal environmental standards.',
      answerKey: 'C',
      options: ['for', 'on', 'with', 'to'],
    },
    {
      prompt: 'Travel expenses must be ------- within ten business days.',
      answerKey: 'D',
      options: ['submission', 'submit', 'submitting', 'submitted'],
    },
    {
      prompt: 'The board expressed ------- about the timeline for the rollout.',
      answerKey: 'A',
      options: ['concern', 'concerns', 'concerning', 'concerned'],
    },
    {
      prompt: 'The software patch is designed to ------- known security vulnerabilities.',
      answerKey: 'B',
      options: ['address', 'addressing', 'addressed', 'addresses'],
    },
    {
      prompt: 'No refunds will be issued ------- proof of purchase is provided.',
      answerKey: 'C',
      options: ['if', 'whether', 'unless', 'although'],
    },
    {
      prompt: 'The warehouse operates ------- on weekends during peak season.',
      answerKey: 'D',
      options: ['extend', 'extended', 'extensive', 'extensively'],
    },
    {
      prompt: 'Applicants must demonstrate ------- in written communication.',
      answerKey: 'A',
      options: ['proficiency', 'proficient', 'proficiently', 'proficiencies'],
    },
    {
      prompt: 'The contract may be ------- if either party gives 30 days’ notice.',
      answerKey: 'B',
      options: ['terminate', 'terminated', 'terminating', 'terminator'],
    },
    {
      prompt: 'We are pleased to ------- our partnership with Harbor Logistics.',
      answerKey: 'C',
      options: ['announcement', 'announcer', 'announce', 'announced'],
    },
    {
      prompt: 'The elevator is temporarily out of service ------- further notice.',
      answerKey: 'D',
      options: ['expect', 'expected', 'expecting', 'pending'],
    },
    {
      prompt: 'All vehicles must be ------- in designated visitor spaces.',
      answerKey: 'A',
      options: ['parked', 'parking', 'park', 'parks'],
    },
    {
      prompt: 'The marketing brochure is still ------- review by the legal team.',
      answerKey: 'A',
      options: ['under', 'below', 'beneath', 'underneath'],
    },
    {
      prompt: 'Customer feedback has been overwhelmingly -------.',
      answerKey: 'C',
      options: ['positivity', 'positively', 'positive', 'positives'],
    },
    {
      prompt: 'The server migration was completed ------- ahead of schedule.',
      answerKey: 'D',
      options: ['success', 'succeed', 'successful', 'successfully'],
    },
    {
      prompt: 'Employees may not ------- confidential data on personal devices.',
      answerKey: 'A',
      options: ['store', 'storage', 'stored', 'storing'],
    },
    {
      prompt: 'The revised price list takes effect ------- the first of next month.',
      answerKey: 'B',
      options: ['in', 'on', 'at', 'by'],
    },
    {
      prompt: 'We apologize for any confusion ------- by outdated instructions.',
      answerKey: 'C',
      options: ['cause', 'causes', 'caused', 'causing'],
    },
    {
      prompt: 'The internship program offers hands-on ------- in project management.',
      answerKey: 'D',
      options: ['expose', 'exposed', 'exposing', 'exposure'],
    },
    {
      prompt: 'The regional manager will ------- the quarterly results on Friday.',
      answerKey: 'A',
      options: ['present', 'presence', 'presented', 'presenting'],
    },
    {
      prompt: 'All workstations must be ------- off at the end of each shift.',
      answerKey: 'B',
      options: ['shut', 'shuts', 'shutting', 'shutdown'],
    },
    {
      prompt: 'The exhibit is free and open ------- the public.',
      answerKey: 'C',
      options: ['for', 'with', 'to', 'by'],
    },
    {
      prompt: 'Ms. Ortiz has been ------- to oversee the rebranding campaign.',
      answerKey: 'D',
      options: ['assign', 'assigns', 'assigning', 'assigned'],
    },
    {
      prompt: 'The parking garage will close ------- at 11 P.M.',
      answerKey: 'A',
      options: ['promptly', 'prompt', 'promptness', 'prompted'],
    },
    {
      prompt: 'We recommend that you ------- your password every 90 days.',
      answerKey: 'B',
      options: ['change', 'changes', 'changing', 'changed'],
    },
    {
      prompt: 'The factory output rose ------- compared with the same period last year.',
      answerKey: 'C',
      options: ['sharp', 'sharpen', 'sharply', 'sharpness'],
    },
    {
      prompt: 'The agenda will be ------- to attendees 24 hours in advance.',
      answerKey: 'C',
      options: ['circulate', 'circulating', 'circulated', 'circulation'],
    },
    {
      prompt: 'Neither the manager nor the assistants ------- present at the hearing.',
      answerKey: 'A',
      options: ['were', 'was', 'is', 'are'],
    },
    {
      prompt: 'Each of the new hires ------- required to complete orientation.',
      answerKey: 'B',
      options: ['are', 'is', 'were', 'be'],
    },
    {
      prompt: 'The data set, along with the charts, ------- stored on a secure server.',
      answerKey: 'C',
      options: ['are', 'were', 'is', 'have'],
    },
    {
      prompt: 'If the client ------- the terms, we will proceed with the shipment.',
      answerKey: 'B',
      options: ['accept', 'accepts', 'accepting', 'accepted'],
    },
    {
      prompt: 'The proposal, if approved, ------- additional funding for training.',
      answerKey: 'A',
      options: ['will secure', 'securing', 'secured', 'secures'],
    },
    {
      prompt: 'By next June, the team ------- the new platform for six months.',
      answerKey: 'B',
      options: ['tests', 'will test', 'will have been testing', 'tested'],
    },
    {
      prompt: 'The memo reminds staff that smoking is ------- on company grounds.',
      answerKey: 'C',
      options: ['allow', 'allows', 'prohibited', 'prohibiting'],
    },
    {
      prompt: 'We would appreciate ------- if you could send the files today.',
      answerKey: 'D',
      options: ['that', 'this', 'its', 'it'],
    },
    {
      prompt: 'The more detailed the report is, ------- useful it will be.',
      answerKey: 'A',
      options: ['the more', 'more', 'most', 'the most'],
    },
    {
      prompt: 'The consultant suggested ------- the launch by one week.',
      answerKey: 'B',
      options: ['delay', 'delaying', 'delayed', 'delays'],
    },
    {
      prompt: 'There ------- several reasons for the decline in foot traffic.',
      answerKey: 'C',
      options: ['is', 'was', 'are', 'has'],
    },
    {
      prompt: 'The equipment should ------- inspected before each shift.',
      answerKey: 'D',
      options: ['be', 'been', 'being', 'is'],
    },
    {
      prompt: 'She is interested ------- joining the cross-functional task force.',
      answerKey: 'A',
      options: ['in', 'on', 'for', 'at'],
    },
    {
      prompt: 'The results were surprising ------- everyone on the committee.',
      answerKey: 'B',
      options: ['for', 'to', 'with', 'by'],
    },
    {
      prompt: 'We look forward ------- your reply at your earliest convenience.',
      answerKey: 'C',
      options: ['for', 'in', 'to', 'at'],
    },
    {
      prompt: 'The policy applies ------- all contractors, without exception.',
      answerKey: 'D',
      options: ['in', 'on', 'at', 'to'],
    },
    {
      prompt: 'The museum is located ------- the river, near the old courthouse.',
      answerKey: 'A',
      options: ['beside', 'besides', 'between', 'among'],
    },
    {
      prompt: 'Please forward this message ------- anyone who has not responded.',
      answerKey: 'B',
      options: ['for', 'to', 'with', 'by'],
    },
    {
      prompt: 'The discount is valid ------- supplies last.',
      answerKey: 'A',
      options: ['while', 'until', 'whenever', 'before'],
    },
    {
      prompt: 'The offer is valid only ------- stated on the certificate.',
      answerKey: 'A',
      options: ['as', 'like', 'than', 'so'],
    },
  ];

  return [...templates, ...extra, ...bulkP5More];
}

/** P6: 4 passage — mỗi passage 1 nhóm 4 câu (16 câu) */
export function buildP6Passages(): { stem: string; items: McqDef[] }[] {
  return [
    {
      stem: `The downtown branch will extend its weekday hours starting April 1. Customers who need assistance with business accounts are encouraged to schedule appointments online. Walk-in service will remain available, but wait times may be longer during peak periods. ---------, clients may use the mobile app to complete routine transactions.`,
      items: [
        {
          prompt: '(1)',
          answerKey: 'B',
          options: ['Otherwise', 'However', 'Additionally', 'Therefore'],
        },
        {
          prompt: '(2)',
          answerKey: 'A',
          options: ['Alternatively', 'Alternative', 'Alternating', 'Alternates'],
        },
        {
          prompt: '(3)',
          answerKey: 'D',
          options: ['notify', 'notifies', 'notified', 'notifications'],
        },
        {
          prompt: '(4)',
          answerKey: 'C',
          options: ['recent', 'recently', 'recentness', 'recency'],
        },
      ],
    },
    {
      stem: `Our company will relocate to the Harborview Tower in June. The new office provides additional meeting rooms and improved access to public transportation. Employees will receive detailed moving instructions by email. ---------, parking permits for the garage must be renewed before May 20.`,
      items: [
        {
          prompt: '(1)',
          answerKey: 'C',
          options: ['Nevertheless', 'Consequently', 'Specifically', 'Likewise'],
        },
        {
          prompt: '(2)',
          answerKey: 'B',
          options: ['submit', 'submitted', 'submitting', 'submits'],
        },
        {
          prompt: '(3)',
          answerKey: 'A',
          options: ['forms', 'form', 'formed', 'forming'],
        },
        {
          prompt: '(4)',
          answerKey: 'D',
          options: ['prompt', 'prompts', 'prompted', 'promptly'],
        },
      ],
    },
    {
      stem: `The annual supplier conference will highlight sustainability initiatives. Presentations will cover waste reduction, energy efficiency, and responsible sourcing. Attendees are asked to register by March 5. ---------, exhibitors should confirm booth dimensions with the events team.`,
      items: [
        {
          prompt: '(1)',
          answerKey: 'A',
          options: ['Furthermore', 'Although', 'Unless', 'Despite'],
        },
        {
          prompt: '(2)',
          answerKey: 'D',
          options: ['measure', 'measures', 'measuring', 'measurements'],
        },
        {
          prompt: '(3)',
          answerKey: 'B',
          options: ['prior', 'prior to', 'priority', 'prioritize'],
        },
        {
          prompt: '(4)',
          answerKey: 'C',
          options: ['ship', 'shipping', 'shipped', 'shipment'],
        },
      ],
    },
    {
      stem: `The IT department will perform scheduled maintenance on Saturday from 1:00 A.M. to 5:00 A.M. During this window, internal systems may be temporarily unavailable. Critical customer-facing services will remain online. ---------, please save your work frequently on Friday evening.`,
      items: [
        {
          prompt: '(1)',
          answerKey: 'B',
          options: ['Accordingly', 'Besides', 'Otherwise', 'Instead'],
        },
        {
          prompt: '(2)',
          answerKey: 'A',
          options: ['affect', 'effect', 'affects', 'effective'],
        },
        {
          prompt: '(3)',
          answerKey: 'C',
          options: ['access', 'accessible', 'accessing', 'accessed'],
        },
        {
          prompt: '(4)',
          answerKey: 'D',
          options: ['issue', 'issues', 'issued', 'issuing'],
        },
      ],
    },
    {
      stem: `The Riverside Café will begin serving breakfast at 6:30 A.M. on weekdays. ------- (1) -------, lunch specials will be posted on the chalkboard near the register. Employees who use payroll deduction should ------- (2) ------- their ID cards at checkout. ------- (3) -------, gratuities are not included in posted prices. Management thanks you for your continued ------- (4) -------.`,
      items: [
        { prompt: '(1)', answerKey: 'C', options: ['However', 'Although', 'In addition', 'Unless'] },
        { prompt: '(2)', answerKey: 'A', options: ['scan', 'scans', 'scanning', 'scanner'] },
        { prompt: '(3)', answerKey: 'B', options: ['Final', 'Finally', 'Finalize', 'Finalized'] },
        { prompt: '(4)', answerKey: 'D', options: ['patron', 'patronize', 'patronizing', 'patronage'] },
      ],
    },
    {
      stem: `Global Freight Solutions is ------- (1) ------- a pilot program for same-day delivery in Metro City. Participating customers will receive tracking links by SMS. ------- (2) -------, oversized packages may require an additional handling fee. Drivers will ------- (3) ------- photo confirmation upon delivery. For questions, please ------- (4) ------- the customer care hotline.`,
      items: [
        { prompt: '(1)', answerKey: 'B', options: ['launch', 'launching', 'launched', 'launcher'] },
        { prompt: '(2)', answerKey: 'A', options: ['However', 'Therefore', 'Moreover', 'Meanwhile'] },
        { prompt: '(3)', answerKey: 'A', options: ['obtain', 'obtains', 'obtaining', 'obtained'] },
        { prompt: '(4)', answerKey: 'A', options: ['call', 'calls', 'calling', 'called'] },
      ],
    },
    {
      stem: `The employee wellness fair will take place in the atrium on Friday. Flu shots will be offered free of charge. ------- (1) -------, biometric screenings require a signed consent form. ------- (2) ------- should register online to reserve a time slot. Light refreshments will be ------- (3) ------- outside Conference Room B. We encourage everyone to take advantage of these ------- (4) -------.`,
      items: [
        { prompt: '(1)', answerKey: 'D', options: ['Besides', 'Thus', 'Instead', 'However'] },
        { prompt: '(2)', answerKey: 'B', options: ['Participant', 'Participants', 'Participate', 'Participation'] },
        { prompt: '(3)', answerKey: 'A', options: ['served', 'serve', 'serving', 'server'] },
        { prompt: '(4)', answerKey: 'B', options: ['benefit', 'benefits', 'beneficial', 'beneficiary'] },
      ],
    },
    {
      stem: `Starting next month, invoices will be issued in PDF format only. Paper copies will no longer be mailed ------- (1) ------- they are specifically requested. Accounts payable asks vendors to ------- (2) ------- purchase order numbers on every invoice. ------- (3) -------, payments may be delayed if documentation is incomplete. We appreciate your ------- (4) ------- with this policy.`,
      items: [
        { prompt: '(1)', answerKey: 'C', options: ['if', 'whether', 'unless', 'although'] },
        { prompt: '(2)', answerKey: 'A', options: ['include', 'included', 'including', 'inclusive'] },
        { prompt: '(3)', answerKey: 'A', options: ['Otherwise', 'Moreover', 'Because', 'While'] },
        { prompt: '(4)', answerKey: 'C', options: ['comply', 'complies', 'compliance', 'complicated'] },
      ],
    },
    {
      stem: `The Lakeside Hotel is undergoing renovations to improve accessibility. ------- (1) -------, the pool will close for two weeks in April. Guests with existing reservations will be ------- (2) ------- by email if their stay is affected. ------- (3) -------, alternative fitness passes can be picked up at the front desk. We apologize for any ------- (4) ------- this may cause.`,
      items: [
        { prompt: '(1)', answerKey: 'B', options: ['Nevertheless', 'Specifically', 'Likewise', 'Hence'] },
        { prompt: '(2)', answerKey: 'C', options: ['notify', 'notifies', 'notified', 'notification'] },
        { prompt: '(3)', answerKey: 'A', options: ['Meanwhile', 'Although', 'Unless', 'Despite'] },
        { prompt: '(4)', answerKey: 'D', options: ['convenient', 'convenience', 'inconvenience', 'conveniently'] },
      ],
    },
    {
      stem: `The research grant application deadline is April 30. Proposals must ------- (1) ------- a detailed budget appendix. ------- (2) -------, teams should list all external collaborators. Late submissions will not be ------- (3) ------- under any circumstances. Award notifications will be sent ------- (4) ------- May 15.`,
      items: [
        { prompt: '(1)', answerKey: 'A', options: ['include', 'inclusive', 'including', 'included'] },
        { prompt: '(2)', answerKey: 'D', options: ['Furthermore', 'Although', 'Unless', 'Instead'] },
        { prompt: '(3)', answerKey: 'B', options: ['accept', 'accepted', 'accepting', 'acceptance'] },
        { prompt: '(4)', answerKey: 'C', options: ['by', 'on', 'before', 'since'] },
      ],
    },
  ];
}

/** P7: passage ngắn — 6 nhóm × 4 câu (24 câu). Thêm 9 nhóm chuẩn → chạy `seed:toeic-reading-p7-extra`. */
export function buildP7Passages(): { stem: string; items: McqDef[] }[] {
  const stems = [
    `Email — Subject: Revised itinerary\n\nDear Travel Team,\nPlease note that the client meeting in Denver has been moved from Tuesday to Wednesday. The hotel reservation has been updated accordingly. If anyone needs to adjust flight arrangements, contact procurement by noon tomorrow.\n\nBest regards,\nLena Ortiz`,
    `Memo — To: All Staff\nFrom: Facilities\nThe west elevator will be out of service from March 10 to March 14 while new safety equipment is installed. Please use the east elevator or the stairs during this period. Thank you for your patience.`,
    `Advertisement — CityTech Expo\nDiscover the latest innovations in smart manufacturing. Free workshops run hourly. Register at the information desk. Early attendees receive a complimentary catalog.`,
    `Article excerpt — Retail analysts report that online grocery sales grew 8% last quarter. Many chains are investing in faster delivery options. Experts expect competition to intensify in urban markets.`,
    `Notice — Library hours will change during the holiday week. The main branch will close at 6 P.M. instead of 9 P.M. Digital resources remain available 24 hours a day.`,
    `Letter — We are pleased to confirm your order #44921. Items will ship within two business days. You may track delivery through our website using your account number.`,
  ];

  const questionSets: McqDef[][] = [
    [
      {
        prompt: 'What is the main purpose of the email?',
        answerKey: 'B',
        options: [
          'To cancel the Denver trip',
          'To inform recipients of a schedule change',
          'To request a new hotel',
          'To announce a hiring decision',
        ],
      },
      {
        prompt: 'When should staff contact procurement?',
        answerKey: 'A',
        options: [
          'Before noon the following day',
          'After the Denver meeting',
          'On Wednesday only',
          'Only if the hotel cancels',
        ],
      },
      {
        prompt: 'What has already been updated?',
        answerKey: 'C',
        options: [
          'Flight tickets',
          'The meeting agenda',
          'The hotel booking',
          'The rental car',
        ],
      },
      {
        prompt: 'Where is the meeting taking place?',
        answerKey: 'D',
        options: ['Chicago', 'Seattle', 'Austin', 'Denver'],
      },
    ],
    [
      {
        prompt: 'What is mentioned about the west elevator?',
        answerKey: 'C',
        options: [
          'It is faster than the east elevator',
          'It will be replaced permanently',
          'It will not operate for several days',
          'It is reserved for visitors',
        ],
      },
      {
        prompt: 'What should employees use during the closure?',
        answerKey: 'B',
        options: [
          'The loading dock',
          'The east elevator or stairs',
          'The parking garage',
          'The service elevator only',
        ],
      },
      {
        prompt: 'Who sent the memo?',
        answerKey: 'A',
        options: ['Facilities', 'IT', 'Human Resources', 'Security'],
      },
      {
        prompt: 'What is being installed?',
        answerKey: 'D',
        options: [
          'New lighting',
          'Security cameras',
          'Air conditioning',
          'Safety equipment',
        ],
      },
    ],
    [
      {
        prompt: 'What can attendees receive?',
        answerKey: 'B',
        options: [
          'A free ticket home',
          'A complimentary catalog',
          'A meal voucher',
          'A parking pass',
        ],
      },
      {
        prompt: 'Where should visitors register?',
        answerKey: 'C',
        options: ['Online only', 'At the exit', 'At the information desk', 'By phone'],
      },
      {
        prompt: 'What is the event mainly about?',
        answerKey: 'A',
        options: [
          'Smart manufacturing',
          'Financial planning',
          'Healthcare technology',
          'Tourism marketing',
        ],
      },
      {
        prompt: 'How often do workshops run?',
        answerKey: 'D',
        options: ['Once a day', 'Twice a week', 'Every other hour', 'Hourly'],
      },
    ],
    [
      {
        prompt: 'What increased last quarter?',
        answerKey: 'C',
        options: [
          'Store rent',
          'Employee turnover',
          'Online grocery sales',
          'Fuel prices',
        ],
      },
      {
        prompt: 'What are many chains investing in?',
        answerKey: 'A',
        options: [
          'Faster delivery',
          'New storefronts',
          'Overseas suppliers',
          'Cash-only checkout',
        ],
      },
      {
        prompt: 'Where does the article say competition will grow?',
        answerKey: 'B',
        options: [
          'Rural areas',
          'Urban markets',
          'Suburban malls',
          'Airport retailers',
        ],
      },
      {
        prompt: 'The word “intensify” is closest in meaning to',
        answerKey: 'D',
        options: ['decrease', 'delay', 'ignore', 'become stronger'],
      },
    ],
    [
      {
        prompt: 'What will change during the holiday week?',
        answerKey: 'B',
        options: [
          'Staff salaries',
          'Library locations',
          'Closing time',
          'Membership fees',
        ],
      },
      {
        prompt: 'What time will the main branch close?',
        answerKey: 'C',
        options: ['9 P.M.', '8 P.M.', '6 P.M.', '5 P.M.'],
      },
      {
        prompt: 'What remains available 24 hours?',
        answerKey: 'A',
        options: [
          'Digital resources',
          'Study rooms',
          'Printing services',
          'Café',
        ],
      },
      {
        prompt: 'Who is the notice intended for?',
        answerKey: 'D',
        options: [
          'Only librarians',
          'City officials',
          'Book publishers',
          'Library users',
        ],
      },
    ],
    [
      {
        prompt: 'What does the letter confirm?',
        answerKey: 'C',
        options: [
          'A payment problem',
          'A return request',
          'An order',
          'A job offer',
        ],
      },
      {
        prompt: 'When will items ship?',
        answerKey: 'B',
        options: [
          'Immediately',
          'Within two business days',
          'After one week',
          'Only on weekends',
        ],
      },
      {
        prompt: 'How can the customer track delivery?',
        answerKey: 'A',
        options: [
          'Through the website',
          'By phone only',
          'At a retail kiosk',
          'Via postal mail',
        ],
      },
      {
        prompt: 'What identifier is mentioned?',
        answerKey: 'D',
        options: ['Phone number', 'Email address', 'ZIP code', 'Account number'],
      },
    ],
  ];

  return stems.map((stem, i) => ({
    stem,
    items: questionSets[i] ?? questionSets[0],
  }));
}
