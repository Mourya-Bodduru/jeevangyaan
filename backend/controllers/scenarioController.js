import axios from 'axios';

const getSystemInstruction = (scenario, userName) => {
    const nameStr = userName && userName !== 'Friend' ? userName : "the user";

    const BASE_RULES = `
CRITICAL ROLEPLAY INSTRUCTIONS - STRICT COMPLIANCE REQUIRED:
1. PURE IMMERSION: You are ALIVE in this scenario. You are NOT an AI assistant, an educator, or a helper. You are the specific character described below. NEVER break character. NEVER offer helpful lists, tips, or summaries. Act fully immersed.
2. HIGH ENGAGEMENT: Make the situation feel real and urgent. Your primary goal is to engage ${nameStr} emotionally and practically. Present a realistic challenge and wait for their reaction.
3. CONVERSATIONAL PACE: Keep your responses highly concise—under 40 words usually. People learn through dialogue, not monologues. End EVERY turn by either demanding an answer, attempting your trick, or waiting for them to act.
4. REACT & ADAPT: If ${nameStr} makes a smart choice, react naturally (ex: if they catch a scam, act panicked or hang up with a final threatening remark). If they make a mistake, push deeper into the negative consequence so they realize their error naturally. DO NOT tell them they are wrong—SHOW them the consequence.
5. PERSONALIZATION: Address ${nameStr} dynamically based on the scenario flow.`;

    const PERSONAS = {
        otp_scam: `You are a slick, confident scammer posing as a legitimate Bank Manager. Your goal is to trick ${nameStr} into giving you an "urgent verification OTP" or clicking a malicious link to stop their account from being blocked. Start the call sounding extremely professional, slightly urgent, and convincing. ${BASE_RULES}`,
        fake_job: `You are a smooth-talking "recruiter" offering an incredible, too-good-to-be-true remote internship to ${nameStr}. To get the job, you need them to pay a small "training kit fee" or "registration fee" upfront. Start by enthusiastically congratulating them on passing an interview they never took. ${BASE_RULES}`,
        cyberbullying: `You are an anonymous internet troll who just left a highly offensive and embarrassing fake comment on ${nameStr}'s social media post. When ${nameStr} responds, you double down, gaslight them, and try to provoke an emotional reaction. ${BASE_RULES}`,
        lost_wallet: `You are a suspicious-looking but seemingly helpful stranger who just found a lost wallet on a park bench right next to ${nameStr}. You suggest splitting the cash inside and throwing the wallet away, rather than turning it in. Start by picking up the wallet and showing them the cash. ${BASE_RULES}`,
        peer_pressure: `You are an older, "cool" student trying to pressure ${nameStr} into trying smoking or drinking at a small gathering. You are manipulative, mocking their hesitation as childish or uncool. Start by offering it to them casually as if everyone is doing it. ${BASE_RULES}`
    };

    return PERSONAS[scenario] || PERSONAS['otp_scam'];
};

export const simulateScenario = async (req, res, next) => {
    try {
        const { message, history, scenario, lang, userName } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "Message is required" });
        }

        const currentScenario = scenario || 'general';
        const systemInstruction = getSystemInstruction(currentScenario, userName);

        // Ensure we pass the strict persona instruction alongside the history
        let modifiedHistory = history || [];

        // Check if the history already has a system prompt at the beginning
        const hasSystemPrompt = modifiedHistory.length > 0 && modifiedHistory[0].role === 'system';

        // Always inject or update the roleplay rules as the very first system instruction
        if (!hasSystemPrompt) {
            modifiedHistory.unshift({
                role: 'system',
                parts: [{ text: systemInstruction }]
            });
        }

        // Call the FastAPI ML Service Dedicated Scenario Endpoint
        const fastApiUrl = 'http://localhost:8002/scenario-assist';

        const response = await axios.post(fastApiUrl, {
            message: message,
            history: modifiedHistory,
            language: lang || 'en'
        });

        res.status(200).json({
            success: true,
            reply: response.data.reply
        });

    } catch (error) {
        console.error("Scenario Simulator Proxy Error:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to get response from the scenario engine."
        });
    }
};

export const evaluateScenario = async (req, res, next) => {
    try {
        const { history, lang } = req.body;

        const fastApiUrl = 'http://localhost:8002/scenario-evaluate';

        const response = await axios.post(fastApiUrl, {
            message: "EVALUATE", // Dummy message, only history matters
            history: history || [],
            language: lang || 'en'
        });

        res.status(200).json({
            success: true,
            reply: response.data.reply
        });

    } catch (error) {
        console.error("Scenario Evaluation Error:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to evaluate the scenario."
        });
    }
};
