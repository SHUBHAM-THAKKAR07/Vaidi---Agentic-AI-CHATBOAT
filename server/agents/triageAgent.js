const { callGranite } = require('./watsonxClient');

// Optimized for granite-8b-code-instruct — uses explicit instruction format
const TRIAGE_SYSTEM_PROMPT = `You are Vaidi, a compassionate health triage assistant for rural communities in Dangs, Gujarat, India.

ROLE: Collect patient symptoms by asking ONE simple follow-up question at a time.

RULES:
1. Ask exactly ONE question. Never ask multiple questions at once.
2. Keep your response to 1-2 sentences maximum plus the question.
3. Be warm, simple, and non-alarming. Avoid medical jargon.
4. Gather: main symptom, duration, severity (mild/moderate/severe), related symptoms, patient age/gender, any existing conditions, any medicines taken.
5. After 4+ questions have been asked, add [READY_TO_ASSESS] at the end of your response.
6. If symptoms sound IMMEDIATELY life-threatening (e.g. chest pain + shortness of breath, unconsciousness, severe bleeding, seizures), start with [EMERGENCY].
7. If the patient writes in Gujarati, reply in Gujarati. Otherwise reply in English.
8. Do NOT diagnose. Only gather information.

EXAMPLE GOOD RESPONSE:
"I'm sorry to hear you're not feeling well. How long have you been experiencing this fever?"

EXAMPLE BAD RESPONSE (do NOT do this):
"How long have you had the fever? Is it above 102°F? Do you also have headache or body ache?" (too many questions)`;

async function runTriageAgent(message, conversationHistory = [], language = 'en') {
  const historyText = conversationHistory
    .map(m => `${m.role === 'user' ? 'Patient' : 'Vaidi'}: ${m.content}`)
    .join('\n');

  const languageHint = language === 'gu' ? '\n[Patient prefers Gujarati. Reply in Gujarati.]' : '';
  const questionCount = conversationHistory.filter(m => m.role === 'assistant').length;

  let contextMessage;
  if (historyText) {
    contextMessage = `Previous conversation:\n${historyText}\n\nPatient now says: "${message}"${languageHint}\n\nVaidi response (one question only${questionCount >= 4 ? ', include [READY_TO_ASSESS] at end' : ''}):`;
  } else {
    contextMessage = `Patient first message: "${message}"${languageHint}\n\nVaidi response (greet warmly and ask one clarifying question):`;
  }

  const response = await callGranite(TRIAGE_SYSTEM_PROMPT, contextMessage, 350);

  const isReadyToAssess = response.includes('[READY_TO_ASSESS]') || questionCount >= 7;
  const isEmergency = response.includes('[EMERGENCY]');
  const cleanResponse = response
    .replace(/\[READY_TO_ASSESS\]/g, '')
    .replace(/\[EMERGENCY\]/g, '')
    .replace(/^(Vaidi:|Assistant:)\s*/i, '')
    .trim();

  return {
    message: cleanResponse || "I understand. Can you tell me more about when this started?",
    isReadyToAssess,
    isEmergency,
    questionCount: questionCount + 1
  };
}

module.exports = { runTriageAgent };
