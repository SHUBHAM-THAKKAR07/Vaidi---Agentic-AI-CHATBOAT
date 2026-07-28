const { callGranite } = require('./watsonxClient');

const FOLLOWUP_SYSTEM_PROMPT = `You are a health coordinator assistant for ASHA workers in rural Gujarat. Based on a patient's follow-up record, generate a brief, actionable visit note suggestion.

Respond with valid JSON only:
{
  "suggested_action": "specific action for the ASHA worker (1-2 sentences)",
  "suggested_action_gu": "same in Gujarati",
  "priority": "high" | "medium" | "low",
  "estimated_visit_duration": "15 min" | "30 min" | "45 min"
}

IMPORTANT: Respond ONLY with the JSON object.`;

async function getFollowupAdvice(patient) {
  const prompt = `Patient: ${patient.patient_name}, Age: ${patient.age}, Village: ${patient.village}
Condition: ${patient.condition}
Last visit: ${patient.last_visit}
Notes: ${patient.notes}
Status: ${patient.status}

Suggest next action for the ASHA worker.`;

  try {
    const response = await callGranite(FOLLOWUP_SYSTEM_PROMPT, prompt, 300);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getDefaultAdvice(patient);
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return getDefaultAdvice(patient);
  }
}

function getDefaultAdvice(patient) {
  const isOverdue = patient.status === 'overdue';
  return {
    suggested_action: isOverdue
      ? `Priority home visit required. Contact ${patient.patient_name} and schedule an appointment immediately.`
      : `Routine follow-up call to confirm appointment and remind about any medications.`,
    suggested_action_gu: isOverdue
      ? `પ્રાથમિક ઘર મુલાકાત જરૂરી છે. ${patient.patient_name} નો સંપર્ક કરો અને તાત્કાલિક મુલાકાત નક્કી કરો.`
      : `નિર્ધારિત મુલાકાત અને દવા વિશે યાદ અપાવવા માટે નિયમિત ફોન કૉલ.`,
    priority: isOverdue ? 'high' : 'medium',
    estimated_visit_duration: '30 min'
  };
}

module.exports = { getFollowupAdvice };
