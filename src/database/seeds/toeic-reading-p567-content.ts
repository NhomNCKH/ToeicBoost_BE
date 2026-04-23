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
      prompt: 'Please ------- that all visitors sign in at the reception desk.',
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
      options: [
        'accommodation',
        'accommodate',
        'accommodating',
        'accommodated',
      ],
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
      options: [
        'inconvenience',
        'inconvenient',
        'inconveniently',
        'inconveniences',
      ],
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

  return [...templates, ...extra].slice(0, 30);
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
          options: [
            'Alternatively',
            'Alternative',
            'Alternating',
            'Alternates',
          ],
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
  ];
}

/** P7: 6 passage ngắn — mỗi nhóm 4 câu (24 câu) */
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
        options: [
          'Online only',
          'At the exit',
          'At the information desk',
          'By phone',
        ],
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
        options: [
          'Phone number',
          'Email address',
          'ZIP code',
          'Account number',
        ],
      },
    ],
  ];

  return stems.map((stem, i) => ({
    stem,
    items: questionSets[i] ?? questionSets[0],
  }));
}
