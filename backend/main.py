from fastapi import FastAPI, UploadFile, File, Form, Response
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import spacy
from typing import List
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with the list of allowed origins if you know them
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("all-mpnet-base-v2")

@app.get("/")
def read_root():
    return {"Hello": "World18"}

@app.post("/extract_and_sort")
async def extract_and_sort(job_description: str = Form(...), skills: str = Form(...), resume_files: List[UploadFile] = File(...)):
    skills_list = json.loads(skills)

    scores = []

    for file in resume_files:
        if file.filename.endswith('.pdf'):
            contents = await file.read()
            reader = PdfReader(BytesIO(contents))
            page = reader.pages[0]
            text = page.extract_text()
            nlp = spacy.load('en_core_web_sm')
            cleaned_text = ' '.join([token.text for token in nlp(text) if not token.is_stop])

            emb_1 = model.encode(cleaned_text)
            emb_2 = model.encode(job_description)
            similarity = round(util.pytorch_cos_sim(emb_1, emb_2).item(), 3)

            # Extracting skills from PDF and calculating skill match score
            skill_score = calculate_skill_score(cleaned_text, skills_list)

            total_score = similarity + skill_score

            scores.append({"filename": file.filename, "score": total_score})
        else:
            return {"error": "Uploaded file is not a PDF"}

    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)
    return sorted_scores

@app.get("/download/{filename}")
async def download_pdf(filename: str):
    try:
        with open(filename, "rb") as file:
            contents = file.read()
        return Response(content=contents, media_type="application/pdf")
    except FileNotFoundError:
        return {"error": "File not found"}

def calculate_skill_score(text: str, skills: List[str]) -> float:
    # This function calculates the skill match score based on the presence of skills in the text
    skill_count = sum(1 for skill in skills if skill.lower() in text.lower())
    skill_score = (skill_count / len(skills)) * 100  # Percentage of skills matched
    return round(skill_score, 2)
