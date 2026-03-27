import os
# Force OpenMP and MKL to use fewer threads to avoid context-switching deadlocks on Windows CPU
os.environ["OMP_NUM_THREADS"] = "4"
os.environ["MKL_NUM_THREADS"] = "4"

import torch
# Also enforce PyTorch level threading limits
torch.set_num_threads(4)

import ollama
from sentence_transformers import SentenceTransformer
import numpy as np
import re

# Set the Ollama model name.
OLLAMA_MODEL = "qwen2.5:7b"

print(f"Configured to use Ollama Local Engine with model: {OLLAMA_MODEL}")

# Centralized Language Database for 17 Indian Languages
LANG_MAP = {
    "hi": {"name": "Hindi", "native": "हिंदी", "guru": "जीवनगुरु"},
    "te": {"name": "Telugu", "native": "తెలుగు", "guru": "జీవన్‌గురు"},
    "ta": {"name": "Tamil", "native": "தமிழ்", "guru": "ஜீவன்குரு"},
    "mr": {"name": "Marathi", "native": "मराठी", "guru": "जीवनगुरू"},
    "bn": {"name": "Bengali", "native": "বাংলা", "guru": "जीवनगुरु"},
    "gu": {"name": "Gujarati", "native": "ગુજરાતી", "guru": "જીવનગુરુ"},
    "kn": {"name": "Kannada", "native": "ಕನ್ನಡ", "guru": "ಜೀವನಗುರು"},
    "ml": {"name": "Malayalam", "native": "മലയാളം", "guru": "ജീവൻഗുരു"},
    "pa": {"name": "Punjabi", "native": "ਪੰਜਾਬੀ", "guru": "ਜੀਵਨਗੁਰੂ"},
    "ur": {"name": "Urdu", "native": "اردו", "guru": "جیون گرو"},
    "or": {"name": "Odia", "native": "ଓଡ଼ିଆ", "guru": "ଜୀବନଗୁରୁ"},
    "sa": {"name": "Sanskrit", "native": "संस्कृतम्", "guru": "जीवनगुरुः"},
    "ne": {"name": "Nepali", "native": "नेपाली", "guru": "जीवनगुरु"},
    "ks": {"name": "Kashmiri", "native": "کأشُر", "guru": "جیون گرو"},
    "gom": {"name": "Konkani", "native": "कोंकणी", "guru": "जीवनगुरु"},
    "as": {"name": "Assamese", "native": "অসমীয়া", "guru": "জীৱনগুৰু"},
    "en": {"name": "English", "native": "English", "guru": "JeevanGuru"}
}

class StoryGenerator:
    def generate(self, content: str, language: str = "en") -> str:
        lang_info = LANG_MAP.get(language, LANG_MAP["en"])
        lang_name = lang_info["name"]
        native_lang = lang_info["native"]
        
        system_msg = f"You are a Creative Storyteller AI. Task: Write a REALISTIC story in {native_lang} based on the topic. RULES: 1. Output ONLY in {native_lang}. 2. Format: Title, followed by '📖 Story', then '🌈 Moral'. 3. No English words."
        
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": f"Topic: {content}\nWrite the story in {native_lang} now."}
        ]
        
        try:
            response = ollama.chat(model=OLLAMA_MODEL, messages=messages, options={"num_thread": 4, "temperature": 0.4, "num_predict": 750})
            return response['message']['content'].strip()
        except Exception as e:
            return f"Error: {e}"

# Load SentenceTransformer
try:
    encoder = SentenceTransformer('all-MiniLM-L6-v2')
except:
    encoder = None

class HybridRagAssistant:
    def __init__(self):
        self.encoder = encoder

    def get_response(self, user_message: str, history_messages: list, modules: list, language: str = "en") -> str:
        if not self.encoder: return "AI Models are initializing..."
        lang_info = LANG_MAP.get(language, LANG_MAP["en"])
        native_lang = lang_info["native"]
        guru_name = lang_info["guru"]

        best_module = None
        if modules:
            try:
                doc_embeddings = self.encoder.encode([f"{m.get('title')} {m.get('description')}" for m in modules])
                query_embedding = self.encoder.encode([user_message])
                similarities = (np.dot(query_embedding, doc_embeddings.T) / (np.linalg.norm(query_embedding) * np.linalg.norm(doc_embeddings, axis=1))).flatten()
                if similarities.max() > 0.35: best_module = modules[similarities.argmax()]
            except: pass

        system_msg = f"You are {guru_name}, a wise life skills mentor. Answer ONLY in {native_lang}. Be concise (2-4 sentences). Strictly educational."
        messages = [{"role": "system", "content": system_msg}]
        if history_messages: messages.extend(history_messages[-2:])
        messages.append({"role": "user", "content": user_message})

        try:
            response = ollama.chat(model=OLLAMA_MODEL, messages=messages, options={"num_thread": 4, "temperature": 0.4, "num_predict": 250})
            reply = response['message']['content'].strip()
            if best_module:
                labels = {"hi": "अनुशंसित", "te": "సిఫార్సు", "ta": "பరిந்துரை"}
                reply += f"\n\n---\n**{labels.get(language, 'Recommended')}:** {best_module.get('title')}"
            return reply
        except: return "Error: Failed to get response."

    def evaluate_debate(self, topic: str, user_argument: str, language: str = "en") -> str:
        native_lang = LANG_MAP.get(language, LANG_MAP["en"])["native"]
        system_msg = f"You are a debate mentor. Respond ONLY in {native_lang}. Max 3 sentences."
        messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": f"Topic: {topic}\nArg: {user_argument}"}]
        try:
            res = ollama.chat(model=OLLAMA_MODEL, messages=messages, options={"num_predict": 150})
            return res['message']['content'].strip()
        except: return "Interesting!"

class ScenarioAssistant:
    def get_scenario_response(self, user_message: str, history_messages: list, language: str = "en") -> str:
        native_lang = LANG_MAP.get(language, LANG_MAP["en"])["native"]
        messages = history_messages[-3:] if history_messages else []
        messages.append({"role": "user", "content": f"{user_message}\n(Respond briefly in {native_lang})"})
        try:
            res = ollama.chat(model=OLLAMA_MODEL, messages=messages, options={"num_predict": 100})
            return res['message']['content'].strip()
        except: return "Go on..."

    def evaluate_scenario(self, history_messages: list, language: str = "en") -> str:
        native_lang = LANG_MAP.get(language, LANG_MAP["en"])["native"]
        system_msg = f"Evaluate in {native_lang}. Summary, Strengths, Improvement. ONLY in {native_lang}."
        transcript = "".join([m['content'] for m in history_messages if m['role'] != 'system'])
        messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": transcript}]
        try:
            res = ollama.chat(model=OLLAMA_MODEL, messages=messages)
            return res['message']['content'].strip()
        except: return "Well done!"
