const { callGranite } = require('./watsonxClient');

// The severity agent needs structured output.
// granite-8b-code-instruct doesn't reliably follow complex JSON schemas,
// so we use a hybrid approach: try to parse any JSON the model returns,
// then normalize/enrich it with deterministic logic.
const SEVERITY_SYSTEM_PROMPT = `You are a medical triage assistant for rural Gujarat primary health care.

Based on the patient conversation, output ONLY a JSON object with these exact fields:
- severity: must be exactly "ROUTINE", "ATTENTION", or "URGENT"
- severity_score: number 1-10
- primary_concern: string, brief label of main issue
- explanation: string, 2-3 sentences in plain English
- self_care: array of 3-4 practical home care tips
- needs_teleconsult: boolean (true if ATTENTION or URGENT)
- specialist_type: "General Physician", "Pediatrician", "Gynecologist", "Cardiologist", "Dermatologist", or null

Severity rules:
- ROUTINE: mild symptoms, manageable at home, no red flags
- ATTENTION: needs doctor within 24-48 hours
- URGENT: needs immediate care (high fever in child, chest pain, difficulty breathing, unconscious)

Respond with ONLY the JSON. Example:
{"severity":"ATTENTION","severity_score":5,"primary_concern":"Fever with headache","explanation":"The patient has had fever for 2 days with headache. This needs medical evaluation within 24-48 hours to rule out malaria or typhoid which are common in this region.","self_care":["Rest at home","Drink plenty of fluids","Take paracetamol for fever"],"needs_teleconsult":true,"specialist_type":"General Physician"}`;

async function runSeverityAgent(conversationHistory) {
  const historyText = conversationHistory
    .map(m => `${m.role === 'user' ? 'Patient' : 'Vaidi'}: ${m.content}`)
    .join('\n');

  const prompt = `Analyze this consultation and output JSON:\n\n${historyText}`;

  const response = await callGranite(SEVERITY_SYSTEM_PROMPT, prompt, 700);

  // Try to extract and normalize any JSON from the response
  let rawResult = tryParseJson(response);

  // Map the model's output (whatever shape it is) to our required schema
  const result = buildNormalizedResult(rawResult, conversationHistory, response);

  return result;
}

function tryParseJson(text) {
  if (!text) return null;
  // Try multiple extraction strategies
  // 1. Direct parse
  try { return JSON.parse(text.trim()); } catch {}
  // 2. Find first valid { ... } block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    // 3. Try to fix common issues: single quotes, trailing commas
    try {
      const fixed = match[0]
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      return JSON.parse(fixed);
    } catch {}
  }
  return null;
}

function buildNormalizedResult(raw, history, rawText) {
  const allText = history.map(m => m.content).join(' ').toLowerCase();
  const rawLower = (rawText || '').toLowerCase();

  // Determine severity from multiple sources
  let severity = 'ATTENTION'; // safe default
  let severityScore = 5;

  if (raw) {
    // Try to extract severity from the model's output regardless of field name
    const severityRaw = raw.severity || raw.urgency || raw.classification || raw.level || '';
    const severityStr = String(severityRaw).toUpperCase();
    if (severityStr.includes('URGENT') || severityStr.includes('EMERGENCY') || severityStr.includes('IMMEDIATE')) {
      severity = 'URGENT'; severityScore = 8;
    } else if (severityStr.includes('ROUTINE') || severityStr.includes('MILD') || severityStr.includes('LOW')) {
      severity = 'ROUTINE'; severityScore = 2;
    } else if (severityStr.includes('ATTENTION') || severityStr.includes('MODERATE') || severityStr.includes('MEDIUM')) {
      severity = 'ATTENTION'; severityScore = 5;
    }
    if (raw.severity_score || raw.score || raw.urgency_score) {
      const sc = Number(raw.severity_score || raw.score || raw.urgency_score);
      if (!isNaN(sc) && sc >= 1 && sc <= 10) {
        severityScore = sc;
        if (sc <= 3) severity = 'ROUTINE';
        else if (sc <= 6) severity = 'ATTENTION';
        else severity = 'URGENT';
      }
    }
  } else {
    // Pure keyword-based fallback
    const urgentKw = ['chest pain', 'difficulty breathing', 'unconscious', 'seizure', 'severe bleeding', 'stroke', 'heart attack'];
    const routineKw = ['mild', 'slight', 'minor', 'small', 'a little'];
    if (urgentKw.some(k => allText.includes(k))) { severity = 'URGENT'; severityScore = 8; }
    else if (routineKw.some(k => allText.includes(k)) && !allText.includes('high fever')) { severity = 'ROUTINE'; severityScore = 2; }
  }

  // Build explanation
  let explanation = '';
  if (raw) {
    explanation = raw.explanation || raw.assessment || raw.summary || raw.description || '';
    if (typeof explanation !== 'string') explanation = JSON.stringify(explanation);
  }
  if (!explanation || explanation.length < 20) {
    explanation = generateExplanation(severity, extractConcern(history));
  }

  // Build self-care
  let selfCare = [];
  if (raw && Array.isArray(raw.self_care)) selfCare = raw.self_care.filter(s => typeof s === 'string');
  else if (raw && Array.isArray(raw.recommendations)) selfCare = raw.recommendations.filter(s => typeof s === 'string');
  else if (raw && Array.isArray(raw.tips)) selfCare = raw.tips.filter(s => typeof s === 'string');
  if (selfCare.length === 0) selfCare = getDefaultSelfCare(severity);

  // Primary concern
  let primaryConcern = '';
  if (raw) primaryConcern = raw.primary_concern || raw.concern || raw.diagnosis || raw.condition || raw.issue || '';
  if (!primaryConcern || primaryConcern.length < 3) primaryConcern = extractConcern(history);

  // Specialist type
  let specialistType = null;
  if (raw) {
    specialistType = raw.specialist_type || raw.specialist || raw.referral || null;
    if (specialistType && !['General Physician', 'Pediatrician', 'Gynecologist', 'Cardiologist', 'Dermatologist'].includes(specialistType)) {
      specialistType = 'General Physician';
    }
  }
  if (!specialistType && severity !== 'ROUTINE') specialistType = 'General Physician';

  const needsTeleconsult = severity !== 'ROUTINE';

  return {
    severity,
    severity_score: severityScore,
    primary_concern: String(primaryConcern).substring(0, 100),
    explanation: String(explanation).substring(0, 500),
    explanation_gu: raw?.explanation_gu || generateExplanationGu(severity),
    self_care: selfCare.slice(0, 5),
    self_care_gu: (raw?.self_care_gu && Array.isArray(raw.self_care_gu)) ? raw.self_care_gu : getDefaultSelfCareGu(severity),
    recommended_action: raw?.recommended_action || getDefaultAction(severity),
    recommended_action_gu: raw?.recommended_action_gu || getDefaultActionGu(severity),
    needs_teleconsult: needsTeleconsult,
    specialist_type: specialistType
  };
}

function extractConcern(history) {
  if (!history || history.length === 0) return 'Health concern';
  const firstUser = history.find(m => m.role === 'user');
  if (!firstUser) return 'Health concern';
  const msg = firstUser.content;
  return msg.length > 70 ? msg.substring(0, 67) + '...' : msg;
}

function generateExplanation(severity, concern) {
  const map = {
    ROUTINE: `Based on the symptoms described, this appears to be a mild condition manageable at home. Monitor for any changes and seek care if symptoms worsen or persist beyond 5 days.`,
    ATTENTION: `The symptoms described warrant medical attention within the next 24-48 hours. A doctor's evaluation is recommended to get a proper assessment and rule out conditions common in this region such as malaria or typhoid.`,
    URGENT: `The symptoms described suggest a potentially serious condition requiring prompt medical care. Please visit your nearest health centre immediately or call 108 for emergency assistance.`,
  };
  return map[severity] || map['ATTENTION'];
}

function generateExplanationGu(severity) {
  const map = {
    ROUTINE: `જણાવ્યા પ્રમાણે લક્ષણો હળવા છે અને ઘરે ઉપચાર થઈ શકે. 5 દિવસ સુધી ધ્યાન રાખો.`,
    ATTENTION: `આ લક્ષણો માટે 24-48 કલાકમાં ડૉક્ટરની સલાહ જરૂરી છે. ટેલી-સલાહ અથવા PHC ની મુલાકાત લો.`,
    URGENT: `આ ગંભીર સ્થિતિ છે. તાત્કાલિક નજીકના આરોગ્ય કેન્દ્રે જાઓ અથવા 108 પર ફોન કરો.`,
  };
  return map[severity] || map['ATTENTION'];
}

function getDefaultSelfCare(severity) {
  const map = {
    ROUTINE: ['Rest at home and avoid strenuous activity', 'Drink plenty of fluids — water, ORS, coconut water', 'Take paracetamol 500mg for fever above 38.5°C', 'Eat light, easily digestible food', 'Seek care if no improvement in 3-5 days'],
    ATTENTION: ['Rest completely — avoid going to work or school', 'Stay hydrated with water, ORS and light liquids', 'Do not self-medicate with antibiotics', 'Monitor temperature every 4-6 hours', 'Seek teleconsultation or visit PHC today'],
    URGENT: ['Do not delay — go to the nearest health centre immediately', 'Call 108 for ambulance if unable to travel', 'Keep the patient calm and lying down', 'Do not give food or medicine until seen by a doctor'],
  };
  return map[severity] || map['ATTENTION'];
}

function getDefaultSelfCareGu(severity) {
  const map = {
    ROUTINE: ['ઘરે આરામ કરો', 'વધારે પ્રવાહી પીઓ — ORS, નારિયેળ પાણી', 'તાવ 38.5°C ઉપર હોય તો પેરાસિટામોલ લો', '3-5 દિવસ સુધારો ન થાય તો PHC જાઓ'],
    ATTENTION: ['સંપૂર્ણ આરામ કરો', 'ORS અને પ્રવાહી પીઓ', 'ડૉક્ટર વિના antibiotic ન લો', 'આજે ટેલી-સલાહ અથવા PHC ની મુલાકાત લો'],
    URGENT: ['તાત્કાલિક નજીકના હોસ્પિટલ જાઓ', 'ઘર ન આવી શકો તો 108 ઉપર ફોન કરો', 'દર્દીને સૂવડાવો અને શાંત રાખો'],
  };
  return map[severity] || map['ATTENTION'];
}

function getDefaultAction(severity) {
  const map = {
    ROUTINE: 'Monitor at home. Visit your ASHA worker or PHC if symptoms persist beyond 5 days or worsen.',
    ATTENTION: 'Book a teleconsultation today. If unable, visit your nearest PHC within 24 hours.',
    URGENT: 'Seek immediate medical care at your nearest CHC or hospital. Call 108 if you need an ambulance.',
  };
  return map[severity] || map['ATTENTION'];
}

function getDefaultActionGu(severity) {
  const map = {
    ROUTINE: 'ઘરે ધ્યાન રાખો. 5 દિવસ ન સુધરે અથવા વધુ ખરાબ થાય તો ASHA અથવા PHC ને મળો.',
    ATTENTION: 'આજે ટેલી-સલાહ બૂક કરો. ન થઈ શકે તો 24 કલાકમાં PHC જાઓ.',
    URGENT: 'તાત્કાલિક નજીકના CHC અથવા હોસ્પિટલ જાઓ. એમ્બ્યુલન્સ માટે 108 ઉપર ફોન કરો.',
  };
  return map[severity] || map['ATTENTION'];
}

module.exports = { runSeverityAgent };
