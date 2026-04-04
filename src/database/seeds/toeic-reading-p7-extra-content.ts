/**
 * 9 nhóm P7 bổ sung (30 câu): 3 nhóm × 4 câu + 6 nhóm × 3 câu.
 * Chạy qua `npm run seed:toeic-reading-p7-extra` — mã nhóm `SEED-P7X-<suffix>-NN` (không trùng seed P567 gốc).
 */
import type { McqDef } from './toeic-reading-p567-content';

export function buildP7ExtraPassages(): { stem: string; items: McqDef[] }[] {
  const stems = [
    `Flyer — Regional Sales Summit\nJoin us on May 22 at the Harbor Convention Center. Registration opens at 8 A.M. and the keynote begins at 9 A.M. Parking vouchers will be distributed at check-in. Late arrivals may miss the team assignments.`,
    `Email — Subject: Q2 budget review\nFinance has approved the revised marketing budget. Please upload your department forecasts to the shared drive by Friday. Managers who miss the deadline will need director-level approval for exceptions.`,
    `Notice — Building access\nTemporary badges are required after 7 P.M. Security will scan IDs at the side entrance. Contractors must be escorted by an employee at all times.`,
    `Memo — Cafeteria\nThe salad bar will close thirty minutes earlier on Wednesdays for inventory. Hot meals remain available until the usual closing time.`,
    `Sign — Shuttle stop moved\nDue to roadwork, the employee shuttle now picks up on Maple Street behind Garage B. Service frequency is unchanged.`,
    `Email snippet — Training reminder\nYour compliance module expires in seven days. Complete the online course to retain system access. IT help desk hours are 8 A.M.–6 P.M.`,
    `Poster — Blood drive\nDonors receive a half-day credit. Appointments are recommended; walk-ins accepted until 2 P.M. Bring photo identification.`,
    `Article snippet — Airlines added three nonstop routes from Midtown Airport this spring. Fares for early bookings are discounted through March 31. Baggage policies are posted on the carrier’s website.`,
    `Notice — Copier maintenance\nHigh-volume copiers on floor 9 will be serviced Tuesday morning. Please use machines on floor 8 or send jobs to the print center.`,
  ];

  const questionSets: McqDef[][] = [
    [
      {
        prompt: 'What time does the keynote start?',
        answerKey: 'C',
        options: ['8 A.M.', '8:30 A.M.', '9 A.M.', '10 A.M.'],
      },
      {
        prompt: 'Where will parking vouchers be given?',
        answerKey: 'B',
        options: ['At the parking garage', 'At check-in', 'By email', 'At the keynote stage'],
      },
      {
        prompt: 'What might late arrivals miss?',
        answerKey: 'A',
        options: ['Team assignments', 'Parking', 'The keynote speaker', 'Lunch service'],
      },
      {
        prompt: 'Where is the event held?',
        answerKey: 'D',
        options: ['City hall', 'Airport hotel', 'Online only', 'Harbor Convention Center'],
      },
    ],
    [
      {
        prompt: 'What has Finance approved?',
        answerKey: 'B',
        options: [
          'A hiring freeze',
          'The revised marketing budget',
          'A new payroll system',
          'Travel for all staff',
        ],
      },
      {
        prompt: 'By when should forecasts be uploaded?',
        answerKey: 'C',
        options: ['Monday', 'Wednesday', 'Friday', 'End of month'],
      },
      {
        prompt: 'What is required if someone misses the deadline?',
        answerKey: 'A',
        options: [
          'Director-level approval',
          'A written apology',
          'HR training',
          'Budget cancellation',
        ],
      },
      {
        prompt: 'Where should files be uploaded?',
        answerKey: 'D',
        options: ['Email to Finance', 'A USB drive', 'Paper forms', 'The shared drive'],
      },
    ],
    [
      {
        prompt: 'When are temporary badges required?',
        answerKey: 'B',
        options: ['Before 7 A.M.', 'After 7 P.M.', 'On weekends only', 'For visitors only'],
      },
      {
        prompt: 'Where will security scan IDs?',
        answerKey: 'C',
        options: ['Main lobby', 'Garage entrance', 'The side entrance', 'Reception desk only'],
      },
      {
        prompt: 'What must contractors have?',
        answerKey: 'A',
        options: ['An employee escort', 'A police permit', 'A parking pass', 'A uniform'],
      },
      {
        prompt: 'The word “temporary” is closest in meaning to',
        answerKey: 'D',
        options: ['permanent', 'optional', 'expensive', 'short-term'],
      },
    ],
    [
      {
        prompt: 'What closes earlier on Wednesdays?',
        answerKey: 'B',
        options: ['The cafeteria', 'The salad bar', 'Hot meals', 'The building'],
      },
      {
        prompt: 'Why does it close earlier?',
        answerKey: 'C',
        options: ['Staff training', 'Cleaning', 'Inventory', 'Holiday schedule'],
      },
      {
        prompt: 'What remains available until the usual time?',
        answerKey: 'A',
        options: ['Hot meals', 'Salads', 'Coffee only', 'Vending machines'],
      },
    ],
    [
      {
        prompt: 'Why was the shuttle stop moved?',
        answerKey: 'D',
        options: ['Low ridership', 'New buses', 'Weather', 'Roadwork'],
      },
      {
        prompt: 'Where is the new pickup location?',
        answerKey: 'B',
        options: [
          'Garage A',
          'Maple Street behind Garage B',
          'Main entrance',
          'Train station',
        ],
      },
      {
        prompt: 'What is unchanged?',
        answerKey: 'C',
        options: ['Fare prices', 'Stop count', 'Service frequency', 'Driver schedules'],
      },
    ],
    [
      {
        prompt: 'What expires in seven days?',
        answerKey: 'A',
        options: ['The compliance module', 'The help desk', 'System passwords', 'Office lease'],
      },
      {
        prompt: 'What must users complete?',
        answerKey: 'D',
        options: ['A survey', 'Hardware setup', 'A meeting', 'The online course'],
      },
      {
        prompt: 'When is the help desk open until?',
        answerKey: 'B',
        options: ['5 P.M.', '6 P.M.', '7 P.M.', 'Midnight'],
      },
    ],
    [
      {
        prompt: 'What do donors receive?',
        answerKey: 'C',
        options: ['Free lunch', 'A parking spot', 'A half-day credit', 'Gift cards'],
      },
      {
        prompt: 'Until what time are walk-ins accepted?',
        answerKey: 'A',
        options: ['2 P.M.', '3 P.M.', '4 P.M.', 'End of day'],
      },
      {
        prompt: 'What should donors bring?',
        answerKey: 'B',
        options: ['Medical records', 'Photo identification', 'Cash', 'A referral'],
      },
    ],
    [
      {
        prompt: 'What did airlines add this spring?',
        answerKey: 'D',
        options: ['Lounges', 'Meals', 'Staff', 'Nonstop routes'],
      },
      {
        prompt: 'Until when are early fares discounted?',
        answerKey: 'C',
        options: ['February 15', 'End of April', 'March 31', 'June 1'],
      },
      {
        prompt: 'Where can baggage rules be found?',
        answerKey: 'A',
        options: [
          'On the carrier’s website',
          'At the ticket counter only',
          'In the airport magazine',
          'By phone after booking',
        ],
      },
    ],
    [
      {
        prompt: 'When will high-volume copiers be serviced?',
        answerKey: 'B',
        options: ['Monday afternoon', 'Tuesday morning', 'Wednesday', 'Friday evening'],
      },
      {
        prompt: 'Which floor has the affected copiers?',
        answerKey: 'D',
        options: ['Floor 7', 'Floor 8', 'Floor 10', 'Floor 9'],
      },
      {
        prompt: 'What is one alternative suggested?',
        answerKey: 'C',
        options: ['Email only', 'Home printers', 'Machines on floor 8', 'Delay all jobs'],
      },
    ],
  ];

  return stems.map((stem, i) => ({
    stem,
    items: questionSets[i] ?? questionSets[0],
  }));
}
