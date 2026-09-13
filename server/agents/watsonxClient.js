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

// Primary and candidate models for watsonx text chat
const DEFAULT_MODEL = 'meta-llama/llama-3-3-70b-instruct';
const CANDIDATE_MODELS = [
  process.env.WATSONX_MODEL_ID,
  'meta-llama/llama-3-3-70b-instruct',
  'ibm/granite-3-8b-instruct',
  'meta-llama/llama-3-1-70b-instruct',
  'meta-llama/llama-3-8b-instruct',
  'ibm/granite-13b-chat-v2'
].filter(id => id && id !== 'ibm/granite-8b-code-instruct'); // ibm/granite-8b-code-instruct is deprecated/removed in watsonx

let cachedWorkingModel = CANDIDATE_MODELS[0] || DEFAULT_MODEL;
const PROJECT_ID = process.env.WATSONX_PROJECT_ID;

async function callGranite(systemPrompt, userMessage, maxNewTokens = 800) {
  const watsonx = getWatsonxClient();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  const modelsToTry = [
    cachedWorkingModel,
    ...CANDIDATE_MODELS.filter(m => m !== cachedWorkingModel)
  ];

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const response = await watsonx.textChat({
        modelId: model,
        projectId: PROJECT_ID,
        messages,
        maxTokens: maxNewTokens,
        temperature: 0.3,
        topP: 0.9,
        repetitionPenalty: 1.1
      });
      const text = response.result?.choices?.[0]?.message?.content || '';
      if (text) {
        cachedWorkingModel = model;
        return text.trim();
      }
    } catch (err) {
      lastError = err;
      const errMsg = err.message || '';
      console.warn(`[WatsonX] Model '${model}' failed:`, errMsg);
      if (
        errMsg.includes('not found') ||
        errMsg.includes('does not support') ||
        errMsg.includes('unsupported')
      ) {
        continue;
      }
      // For other errors, continue to try fallback model before giving up
      continue;
    }
  }

  console.error('[WatsonX Error] All models failed:', lastError?.message || lastError);
  throw new Error('AI service temporarily unavailable');
}

module.exports = { callGranite };

