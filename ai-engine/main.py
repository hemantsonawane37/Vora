from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
import uvicorn
import base64
import io
from PIL import Image
import requests
import json
import logging

# --- CONFIGURATION & SETUP ---
print("Loading AI Models... (This may take a moment)")
model = SentenceTransformer('clip-ViT-B-32')
print("AI Models Loaded. Ready.")

# Load Universal Logic Configuration
try:
    with open('signatures.json', 'r') as f:
        DOMAIN_CONFIG = json.load(f)
    print("DEBUG: Loaded Universal Logic Config (signatures.json)")
except Exception as e:
    print(f"ERROR: Could not load signatures.json: {e}")
    DOMAIN_CONFIG = {}

# --- PILLAR DATABASE ---
PILLARS_DB = {
    "food": ["biryani", "biriyani", "pizza", "burger", "pasta", "dish", "cuisine", "lunch", "dinner", "breakfast", "meal", "cake", "coffee", "tea", "food"],
    "nature": ["manali", "himalaya", "mountain", "beach", "ocean", "forest", "sky", "sunset", "travel", "vacation"],
    "people": ["boy", "girl", "man", "woman", "person", "people", "staff", "employee", "worker", "chef", "waiter", "bellboy", "doctor", "professional"],
    "object": ["isolated", "png", "cutout", "icon", "sticker", "logo", "transparent"],
    "architecture": ["office", "room", "interior", "building", "house", "decor", "furniture", "hotel", "lobby"],
    "work": ["working", "laptop", "meeting", "business", "job", "career"],
    "tech": ["computer", "code", "programming", "software", "hardware", "technology"],
    "abstract": ["texture", "pattern", "background", "wallpaper", "gradient", "blur"],
    "hospitality": ["hotel", "staff", "waiter", "hospitality", "bellboy"]
}

PILLAR_MAPPING = {
    "FOOD": "FOOD",
    "BIRYANI": "FOOD",
    "PIZZA": "FOOD",
    "BURGER": "FOOD",
    "PLACE": "NATURE",
    "PEOPLE": "PEOPLE",
    "WORK": "WORK_OFFICE",
    "OBJECT": "PNG_OBJECT",
    "TECH": "TECH",
    "ABSTRACT": "TEXTURES",
    "FASHION": "BEAUTY",
    "MEDICAL": "MEDICAL",
    "WILDLIFE": "WILDLIFE",
    "DATA_UX": "DATA_UX",
    "FESTIVE": "FESTIVE_CULTURAL",
    "INTERIOR": "INTERIOR_DESIGN",
    "AUTOMOTIVE": "AUTOMOTIVE",
    "HISTORY": "HISTORY",
    "EDUCATION": "EDUCATION",
    "HOSPITALITY": "HOSPITALITY"
}

def identify_pillar(text: str) -> str:
    q = text.lower()
    
    # LEVEL 1: Geographical (Highest Priority)
    if any(k in q for k in ["lake", "mountain", "ocean", "river", "forest", "nature", "valley", "peak", "landscape"]):
        return "nature"
    
    # LEVEL 2: Professional Personnel
    if any(k in q for k in ["worker", "staff", "student", "doctor", "chef", "housekeeper", "nurse", "person", "man", "woman"]):
        if "hotel" in q or "hospitality" in q: return "hospitality"
        if "hospital" in q or "doctor" in q or "medical" in q: return "medical"
        if "student" in q or "school" in q or "college" in q: return "education"
        return "work"
        
    # LEVEL 3: Industry & Tech
    if "png" in q or "isolated" in q: return "object" # Maps to PNG_OBJECT
    
    if any(k in q for k in ["smartphone", "laptop", "tech", "circuit", "data", "dashboard"]):
        return "data_ux" if "chart" in q or "dashboard" in q or "ui" in q else "tech"
        
    if any(k in q for k in ["car", "auto", "vehicle", "engine"]): return "automotive"
    
    if any(k in q for k in ["room", "living", "interior", "furniture", "decor"]): return "interior" # Maps to INTERIOR_DESIGN

    # LEVEL 4: Culinary (Final Catch)
    if any(k in q for k in ["food", "dish", "curry", "rice", "plate", "biryani", "pizza", "burger", "pasta"]):
        return "food"
        
    # LEVEL 5: Fallback to DB
    for pillar, keywords in PILLARS_DB.items():
        if any(k in q for k in keywords):
            return pillar

    return "general"

# --- API APP ---
app = FastAPI(title="DesignerHub AI Engine")

class VerifyRequest(BaseModel):
    text: str
    image_url: str
    color: Optional[str] = None
    location: Optional[dict] = None

class ExpansionRequest(BaseModel):
    text: str # For /expand alias if using post body with 'text' or query param

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Universal Logic Engine V8"}

def get_image_embedding(url):
    try:
        response = requests.get(url, stream=True, timeout=5)
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content)).convert('RGB')
        return model.encode(image)
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

# --- UNIVERSAL LOGIC ENGINE ---

# --- UNIVERSAL LOGIC ENGINE (FINAL REVISION) ---

def calculate_verification(labels, pillar, sem_score, img_emb):
    domain = DOMAIN_CONFIG.get(PILLAR_MAPPING.get(pillar.upper(), pillar.upper()), {})
    
    # 0. UNIVERSAL HARD VETO LOGIC (Preserved)
    allowed_list = domain.get('allowed', [])
    actual_vetos = [l for l in domain.get('vetos', []) if l in labels and l not in allowed_list]
    
    if actual_vetos:
        print(f"Visual Veto: Detected {actual_vetos}")
        return 0.0, 1.0  # Immediate Rejection

    # 1. SIGNATURE CALCULATION
    domain_traits = domain.get('traits', [])
    if domain_traits:
        matches = [t for t in domain_traits if t in labels]
        match_rate = len(matches) / max(len(domain_traits), 1)
    else:
        match_rate = 1.0 # No traits required

    # 2. THE 99.9% SARI GUARD (Contrastive Check)
    # If it's a student query but NO physical student traits (books/uniforms) were found...
    # Updated to < 0.22 to catch cases where "student" + "learning" (2/11 = 0.18) are detected but it's still just a sari portrait.
    if pillar.lower() == "education" and match_rate < 0.22:
        # We compare the image against "Non-Educational" identity clusters
        contrast_prompts = ["a photo of a sari", "traditional indian clothing", "fashion model portrait"]
        c_embs = model.encode(contrast_prompts)
        c_scores = util.cos_sim(img_emb, c_embs)[0]
        
        # If it looks like a "Sari/Fashion" shot more than a "Student" shot, dock it.
        # This effectively forces it to FAIL the fusion check below.
        if max(c_scores) > 0.27:
            print(f"Sari Guard: Docking Score (Traditional Match: {max(c_scores):.2f})")
            sem_score -= 0.15 

    # 3. DYNAMIC SEMANTIC FUSION (INTENT DOMINANCE)
    # If sem_score is high (>0.28 for Identity), we trust it's a student and waive the signature penalty.
    # Note: Sari Guard (above) effectively 'vetoes' this by docking sem_score below 0.28.
    fusion_threshold = 0.28 if pillar.lower() in ["education", "hospitality", "medical"] else 0.35
    is_strong_intent = sem_score > fusion_threshold

    # 4. FINAL CALCULATION
    # Penalty applies if trait match is low AND semantic intent is not strong enough (after docking)
    penalty = 0.45 if (match_rate < domain.get('min_score', 0.15) and not is_strong_intent) else 0.0
    
    final_score = (sem_score * 0.7) + (match_rate * 0.3) - penalty
    
    return round(max(final_score, 0.0), 4), 0.0

@app.post("/verify")
def verify_relevance(req: VerifyRequest):
    print(f"\n--- Verifying: '{req.text}' ---")
    
    # 0. Image Embedding
    img_emb = get_image_embedding(req.image_url)
    if img_emb is None:
         return {"is_relevant": False, "score": 0.0, "reason": "Image processing failed"}
    
    # 1. Base Semantic Score
    text_emb = model.encode(req.text)
    semantic_score = float(util.cos_sim(img_emb, text_emb)[0])
    print(f"Base Semantic Score: {semantic_score:.4f}")
    
    # 2. Detect Labels
    detected_pillar = identify_pillar(req.text)
    json_key = PILLAR_MAPPING.get(detected_pillar.upper(), detected_pillar.upper())
    domain_rules = DOMAIN_CONFIG.get(json_key, {})
    
    detected_labels = []
    
    if domain_rules:
        candidates = domain_rules.get("traits", []) + domain_rules.get("vetos", []) + domain_rules.get("allowed", [])
        candidates = list(set(candidates))
        
        if candidates:
            cand_prompts = [f"a photo of {c}" for c in candidates]
            cand_embs = model.encode(cand_prompts)
            cand_scores = util.cos_sim(img_emb, cand_embs)[0]
            
            for idx, score in enumerate(cand_scores):
                if score > 0.25:
                    detected_labels.append(candidates[idx])
    
    print(f"Active Domain: {json_key} | Detected Labels: {detected_labels}")

    # 3. Calculate Verification
    # Passing img_emb for Contrastive Precision check
    final_score, vis_pen = calculate_verification(detected_labels, detected_pillar.upper(), semantic_score, img_emb)
    
    # 4. Identity Guard (Boy != Man Fix)
    anchor_pen = 0.0
    q_lower = req.text.lower()
    anchor_subjects = ["boy", "girl", "man", "woman"]
    detected_anchor = next((s for s in anchor_subjects if s in q_lower), None)
    
    if detected_anchor:
        valid_terms = [detected_anchor]
        if detected_anchor in ["boy", "man"]: valid_terms.extend(["boy", "man", "male"])
        if detected_anchor in ["girl", "woman"]: valid_terms.extend(["girl", "woman", "female"])
        
        a_prompts = [f"a photo of {t}" for t in set(valid_terms)]
        a_embs = model.encode(a_prompts)
        a_scores = util.cos_sim(img_emb, a_embs)[0]
        max_a = float(max(a_scores))
        
        if max_a < 0.20:
             print(f"Identity Fail: {detected_anchor} mismatch (Max: {max_a:.3f})")
             anchor_pen = 0.40
    
    final_score -= anchor_pen
    
    if vis_pen > 0:
        final_score = 0.0

    is_pass = final_score > 0.25
    
    print(f"FINAL: {final_score:.4f} (Sem: {semantic_score:.3f} | Pen: {vis_pen+anchor_pen}) -> {'PASS' if is_pass else 'REJECT'}")

    print(f"FINAL: {final_score:.4f} (Sem: {semantic_score:.3f} | Pen: {vis_pen+anchor_pen}) -> {'PASS' if is_pass else 'REJECT'}")

    return {
        "verified": is_pass,
        "score": round(final_score, 4),
        "details": {
            "semantic_score": round(semantic_score, 4),
            "visual_penalty": vis_pen,
            "anchor_penalty": anchor_pen,
            "context_bonus": 0.0
        }
    }

@app.post("/expand")
def expand_query(query: str):
    # Support for simple query parameter "expand?query=..."
    # Also support JSON body if passed as dictionary (FastAPI handles this if typed as Str? No, Pydantic)
    # The previous Node.js call uses query param? `?query=...`
    # FastAPI `query: str` defaults to query param. Good.
    
    detected_pillar = identify_pillar(query)
    optimized_query = f"{query}  -text -overlay"
    
    expansions = [
        f"High quality {query}",
        f"Cinematic {query}",
        f"Professional {query}",
        f"Creative {query}"
    ]
    
    # Simple logic V6 Fallback
    if detected_pillar == "food":
        optimized_query = f"{query} flat lay overhead"
    elif detected_pillar == "hospitality":
         optimized_query = f"{query} professional service"
    
    return {
        "original": query,
        "optimized_query": optimized_query,
        "expansions": expansions
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting Uvicorn Server on Port 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
