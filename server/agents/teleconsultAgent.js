const { callGranite } = require('./watsonxClient');

const TELECONSULT_SYSTEM_PROMPT = `You are a teleconsultation coordinator for Vaidi Health, serving rural Gujarat. Based on a patient's health assessment, you provide relevant pre-consultation preparation advice.

You MUST respond with valid JSON only:
{
  "preparation_tips": ["tip 1", "tip 2", "tip 3"],
  "preparation_tips_gu": ["tip 1 in Gujarati", "tip 2 in Gujarati", "tip 3 in Gujarati"],
  "what_to_have_ready": ["item 1", "item 2"],
  "what_to_have_ready_gu": ["item 1 in Gujarati", "item 2 in Gujarati"],
  "questions_to_ask_doctor": ["question 1", "question 2", "question 3"],
  "questions_to_ask_doctor_gu": ["question 1 in Gujarati", "question 2 in Gujarati", "question 3 in Gujarati"]
}

Keep tips practical for rural patients: they may have limited access to pharmacy, may need to note symptoms on paper, etc.
IMPORTANT: Respond ONLY with the JSON object.`;

const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Priya Mehta', specialty: 'General Physician', languages: ['English', 'Gujarati', 'Hindi'], experience: '12 years', rating: 4.8, available_from: 'Today 2:00 PM' },
  { id: 'd2', name: 'Dr. Rajan Patel', specialty: 'General Physician', languages: ['Gujarati', 'Hindi'], experience: '8 years', rating: 4.6, available_from: 'Today 4:30 PM' },
  { id: 'd3', name: 'Dr. Sunita Desai', specialty: 'Pediatrician', languages: ['English', 'Gujarati'], experience: '15 years', rating: 4.9, available_from: 'Tomorrow 10:00 AM' },
  { id: 'd4', name: 'Dr. Amit Shah', specialty: 'Cardiologist', languages: ['English', 'Hindi'], experience: '20 years', rating: 4.7, available_from: 'Tomorrow 2:00 PM' },
  { id: 'd5', name: 'Dr. Kavita Joshi', specialty: 'Gynecologist', languages: ['English', 'Gujarati', 'Hindi'], experience: '10 years', rating: 4.8, available_from: 'Today 5:00 PM' },
  { id: 'd6', name: 'Dr. Nilesh Vasava', specialty: 'Dermatologist', languages: ['Gujarati', 'Hindi'], experience: '6 years', rating: 4.5, available_from: 'Tomorrow 11:00 AM' }
];

function generateSlots(doctorId) {
  const slots = [];
  const now = new Date();
  const baseHours = [9, 10, 11, 14, 15, 16, 17];

  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    for (const hour of baseHours) {
      if (dayOffset === 0 && hour <= now.getHours()) continue; // Skip past slots for today
      const slotTime = `${hour < 10 ? '0' + hour : hour}:00`;
      const available = Math.random() > 0.4; // 60% slots available
      slots.push({
        id: `${doctorId}-${dayOffset}-${hour}`,
        date: dateStr,
        time: slotTime,
        available,
        duration: '15 min'
      });
    }
  }
  return slots;
}

async function getPreparationAdvice(severityResult) {
  const prompt = `Patient assessment:
- Primary concern: ${severityResult.primary_concern}
- Severity: ${severityResult.severity}
- Recommended specialist: ${severityResult.specialist_type || 'General Physician'}

Provide teleconsultation preparation advice for this rural Gujarat patient.`;

  const response = await callGranite(TELECONSULT_SYSTEM_PROMPT, prompt, 500);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return getDefaultPreparation();

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return getDefaultPreparation();
  }
}

function getDefaultPreparation() {
  return {
    preparation_tips: [
      'Note down all your symptoms and when they started',
      'List any medicines you are currently taking',
      'Be in a quiet place with good mobile signal for the call'
    ],
    preparation_tips_gu: [
      'તમારા બધા લક્ષણો અને ક્યારે શરૂ થયા તે નોંધ કરો',
      'હાલ તમે લઈ રહ્યા છો તે બધી દવાઓ નોંધ કરો',
      'ફોન કૉલ માટે સારા સિગ્નલ સાથે શાંત જગ્યાએ રહો'
    ],
    what_to_have_ready: ['Government ID', 'Any previous prescriptions or test reports'],
    what_to_have_ready_gu: ['સરકારી ઓળખ કાર્ડ', 'અગાઉના કોઈ પ્રિસ્ક્રિપ્શન અથવા ટેસ્ટ રિપોર્ટ'],
    questions_to_ask_doctor: [
      'What could be causing my symptoms?',
      'Do I need any tests done?',
      'What medicines should I take and for how long?'
    ],
    questions_to_ask_doctor_gu: [
      'મારા લક્ષણો શા કારણે થઈ શકે?',
      'મારે કોઈ ટેસ્ટ કરાવવાની જરૂર છે?',
      'મારે કઈ દવા લેવી જોઈએ અને કેટલા સમય સુધી?'
    ]
  };
}

function getDoctorsForSpecialty(specialty) {
  if (!specialty || specialty === 'General Physician') {
    return MOCK_DOCTORS.filter(d => d.specialty === 'General Physician');
  }
  const specialists = MOCK_DOCTORS.filter(d => d.specialty === specialty);
  const general = MOCK_DOCTORS.filter(d => d.specialty === 'General Physician');
  return [...specialists, ...general].slice(0, 3);
}

module.exports = { getPreparationAdvice, getDoctorsForSpecialty, generateSlots };
