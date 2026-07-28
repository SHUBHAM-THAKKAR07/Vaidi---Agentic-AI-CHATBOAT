const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
const { IamAuthenticator } = require('@ibm-cloud/watsonx-ai/authentication');

let client = null;

function getWatsonxClient() {
  if (!client) {
    if (!process.env.WATSONX_API_KEY || !process.env.WATSONX_URL) {
      throw new Error('WatsonX credentials not configured');
    }
    client = WatsonXAI.newInstance({
      version: '2024-05-31',
      serviceUrl: process.env.WATSONX_URL,
      authenticator: new IamAuthenticator({
        apikey: process.env.WATSONX_API_KEY
      })
    });
  }
  return client;
}

// IBM Granite model available in this watsonx.ai deployment region
// granite-8b-code-instruct supports chat and performs well on health triage in this project
const MODEL_ID = process.env.WATSONX_MODEL_ID || 'ibm/granite-8b-code-instruct';
const PROJECT_ID = process.env.WATSONX_PROJECT_ID;

async function callGranite(systemPrompt, userMessage, maxNewTokens = 800) {
  const watsonx = getWatsonxClient();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await watsonx.textChat({
      modelId: MODEL_ID,
      projectId: PROJECT_ID,
      messages,
      maxTokens: maxNewTokens,
      temperature: 0.3,
      topP: 0.9,
      repetitionPenalty: 1.1
    });
    const text = response.result?.choices?.[0]?.message?.content || '';
    return text.trim();
  } catch (err) {
    console.error('[WatsonX Error]', err.message || err);
    throw new Error('AI service temporarily unavailable');
  }
}

module.exports = { callGranite };
