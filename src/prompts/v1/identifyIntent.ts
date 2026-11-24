import { z } from 'zod';

export const IntentSchema = z.object({
  intent: z.enum(['schedule', 'cancel', 'unknown']).describe('The user intent'),
  professionalId: z.number().optional().describe('ID of the medical professional'),
  professionalName: z.string().optional().describe('Name of the medical professional'),
  datetime: z.string().optional().describe('Resolve relative dates (today, tomorrow) using current_date as reference. ' +
    'Keep the exact hour the user said (e.g. "19h" → 19:00:00). ' +
    'Local date and time exactly as the user said it, format YYYY-MM-DDTHH:mm:ss. No "Z", no UTC offset.'),
  patientName: z.string().optional().describe('Patient name extracted from question'),
  reason: z.string().optional().describe('Reason for appointment (for scheduling)'),
});

export type IntentData = z.infer<typeof IntentSchema>;

export const getSystemPrompt = (professionals: any[]) => {
  return JSON.stringify({
    role: 'Intent Classifier for Medical Appointments',
    task: 'Identify user intent and extract all appointment-related details',
    professionals: professionals.map(p => ({ id: p.id, name: p.name, specialty: p.specialty })),
    current_date: new Date().toISOString(),
    rules: {
      schedule: {
        description: 'User wants to book/schedule a new appointment',
        keywords: ['schedule', 'book', 'appointment', 'I want to', 'make an appointment'],
        required_fields: ['professionalId', 'datetime', 'patientName'],
        optional_fields: ['reason']
      },
      cancel: {
        description: 'User wants to cancel an existing appointment',
        keywords: ['cancel', 'remove', 'delete', 'cancel my appointment'],
        required_fields: ['professionalId', 'datetime', 'patientName']
      },
      unknown: {
        description: 'Anything not related to scheduling or cancelling appointments',
        examples: ['weather questions', 'general info', 'unrelated queries']
      }
    },
    extraction_instructions: {
      professionalId: 'Match the professional name mentioned in the question to the ID from the professionals list. Use fuzzy matching.',
      professionalName: 'Extract the professional name as mentioned by the user',
      datetime: 'Resolve relative dates (today, tomorrow) using current_date as reference. ' +
            'Keep the exact hour the user said (e.g. "19h" → 19:00:00). ' +
            'Output format YYYY-MM-DDTHH:mm:ss. Do NOT convert to UTC and do NOT add "Z" or an offset.',
      patientName: 'Extract the patient name from the question or context',
      reason: 'Extract the reason/purpose for the appointment (only for scheduling)'
    },
    examples: [
      {
        input: 'I want to schedule with Dr. Alicio da Silva for tomorrow at 4pm for a check-up',
        output: { intent: 'schedule', professionalId: 1, professionalName: 'Dr. Alicio da Silva', datetime: new Date(new Date(Date.now() + 864e5).setHours(16, 0, 0, 0)).toISOString(), reason: 'check-up' }
      },
      {
        input: 'Cancel my appointment with Dr. Ana Pereira today at 11am',
        output: { intent: 'cancel', professionalId: 2, professionalName: 'Dr. Ana Pereira', datetime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString() }
      },
      {
        input: 'What is the weather today?',
        output: { intent: 'unknown' }
      }
    ]
  });
};

export const getUserPromptTemplate = (question: string) => {
  return JSON.stringify({
    question,
    instructions: [
      'Carefully analyze the question to determine the user intent',
      'Extract all relevant appointment details',
      'Keep dates and times in local time as said by the user (format YYYY-MM-DDTHH:mm:ss, no "Z", no offset)',
      'Match professional names to their IDs',
      'Return only the fields that are present in the question'
    ]
  });
};
