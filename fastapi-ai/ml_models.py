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
OLLAMA_MODEL = "qwen2.5:0.5b"

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
        
        format_structure = "STRICT FORMAT TO FOLLOW:\n**[Title]**\n\n📖 Story\n[Write the paragraphs of the real-world scenario here]\n\n🌈 Moral\n[One sentence moral related to the topic]"
        
        if language == "en":
            system_msg = f"You are a Creative Storyteller AI. Task: Create a completely NEW, relatable, real-world scenario story for children that teaches the underlying lesson of the module topic. RULES: 1. Do NOT just repeat the topic content. Invent a scenario with specific everyday characters (e.g., a shopkeeper, a student, a neighbor) dealing with a situation. 2. Output ONLY in {native_lang}. 3. {format_structure} 4. Do not output anything outside this format."
            messages = [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": f"Module Topic: {content}\nWrite the story following the exact structure."}
            ]
            options = {"num_thread": 4, "temperature": 0.4, "num_predict": 750}
        else:
            system_msg = f"You are a Creative Storyteller AI. Task: Create a completely NEW, relatable, real-world scenario story for children that teaches the underlying lesson of the module in {lang_name} ({native_lang}). RULES: 1. Do NOT just repeat the topic content. Invent a scenario with specific everyday characters. 2. Output ONLY natively in {lang_name} script. 3. {format_structure} 4. Do not output anything outside this format. DO NOT repeat phrases."
            messages = [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": f"Module Topic: {content}\nWrite the story naturally in {lang_name} ({native_lang}) following the exact structure."}
            ]
            options = {"num_thread": 4, "temperature": 0.5, "num_predict": 750, "repeat_penalty": 1.2, "top_k": 40, "top_p": 0.8}
        
        try:
            response = ollama.chat(model=OLLAMA_MODEL, messages=messages, options=options)
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

        if language == "en":
            system_msg = f"You are {guru_name}, a wise life skills mentor. Answer ONLY in {native_lang}. Be concise (2-4 sentences). Strictly educational."
            messages = [{"role": "system", "content": system_msg}]
            if history_messages: messages.extend(history_messages[-2:])
            messages.append({"role": "user", "content": user_message})
            options = {"num_thread": 4, "temperature": 0.4, "num_predict": 250}
        else:
            lang_name = lang_info["name"]
            system_msg = f"You are {guru_name}, a wise life skills mentor. Answer natively in {lang_name} ({native_lang}). Be concise (2-4 sentences). Strictly educational. DO NOT repeat sentences."
            messages = [{"role": "system", "content": system_msg}]
            if history_messages: messages.extend(history_messages[-2:])
            messages.append({"role": "user", "content": f"Answer naturally in {lang_name} ({native_lang}) without repeating yourself: {user_message}"})
            options = {"num_thread": 4, "temperature": 0.5, "num_predict": 250, "repeat_penalty": 1.25, "top_k": 40, "top_p": 0.8}

        try:
            response = ollama.chat(model=OLLAMA_MODEL, messages=messages, options=options)
            reply = response['message']['content'].strip()
            if best_module:
                labels = {"hi": "अनुशंसित", "te": "సిఫార్సు", "ta": "பరిந்துரை"}
                reply += f"\n\n---\n**{labels.get(language, 'Recommended')}:** {best_module.get('title')}"
            return reply
        except Exception as e:
            print(f"Ollama Chat Error: {e}")
            return "Error: Failed to reach JeevanGuru. Please ensure Ollama is running."

    def evaluate_debate(self, topic: str, user_argument: str, language: str = "en") -> str:
        lang_info = LANG_MAP.get(language, LANG_MAP["en"])
        native_lang = lang_info["native"]
        lang_name = lang_info["name"]
        
        if language == "en":
            system_msg = f"You are a debate mentor. Respond ONLY in {native_lang}. Max 3 sentences."
            messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": f"Topic: {topic}\nArg: {user_argument}"}]
            options = {"num_predict": 150}
        else:
            system_msg = f"You are a debate mentor. Respond naturally ONLY in {lang_name} ({native_lang}). Max 3 sentences. DO NOT repeat yourself."
            messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": f"Topic: {topic}\nArg: {user_argument}\nEvaluate in {lang_name} without repeating."}]
            options = {"num_predict": 150, "temperature": 0.5, "repeat_penalty": 1.2, "top_p": 0.8}
            
        try:
            res = ollama.chat(model=OLLAMA_MODEL, messages=messages, options=options)
            return res['message']['content'].strip()
        except Exception as e:
            print(f"Ollama Debate Error: {e}")
            return "Interesting! Let's discuss more."

class ScenarioAssistant:
    def get_scenario_response(self, user_message: str, history_messages: list, language: str = "en") -> str:
        lang_info = LANG_MAP.get(language, LANG_MAP["en"])
        native_lang = lang_info["native"]
        lang_name = lang_info["name"]
        
        sys_msg = next((m for m in history_messages if m['role'] == 'system'), None)
        recent_history = [m for m in history_messages if m['role'] != 'system'][-4:]
        
        messages = []
        if sys_msg:
            sys_msg['content'] += f"\n--- \nCRITICAL RULES: 1. STAY FULLY IN CHARACTER ALWAYS. 2. NEVER say you are an AI or language model. 3. Act like a real human facing this real world problem. 4. Speak purely natively in {lang_name} ({native_lang})."
            messages.append(sys_msg)
            
        messages.extend(recent_history)
        options = {"num_predict": 150} # slightly more tokens to give better roleplay
        
        if language == "en":
            messages.append({"role": "user", "content": f"{user_message}"})
        else:
            messages.append({"role": "user", "content": f"{user_message}"})
            options.update({"temperature": 0.5, "repeat_penalty": 1.2, "top_p": 0.8})
            
        try:
            res = ollama.chat(model=OLLAMA_MODEL, messages=messages, options=options)
            return res['message']['content'].strip()
        except Exception as e:
            print(f"Ollama Scenario Response Error: {e}")
            return "Go on..."

    def evaluate_scenario(self, history_messages: list, language: str = "en") -> str:
        lang_info = LANG_MAP.get(language, LANG_MAP["en"])
        native_lang = lang_info["native"]
        lang_name = lang_info["name"]
        
        transcript = "".join([m['content'] for m in history_messages if m['role'] != 'system'])
        
        if language == "en":
            system_msg = f"Evaluate in {native_lang}. Summary, Strengths, Improvement. ONLY in {native_lang}."
            options = {}
        else:
            system_msg = f"Evaluate natively in {lang_name} ({native_lang}). Summary, Strengths, Improvement. ONLY in {lang_name}. NO repetition."
            options = {"temperature": 0.5, "repeat_penalty": 1.2, "top_p": 0.8}
            
        messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": transcript}]
        try:
            res = ollama.chat(model=OLLAMA_MODEL, messages=messages, options=options) if options else ollama.chat(model=OLLAMA_MODEL, messages=messages)
            return res['message']['content'].strip()
        except Exception as e:
            print(f"Ollama Scenario Evaluation Error: {e}")
            return "Well done! Keep practicing."
