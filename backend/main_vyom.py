from fastapi import FastAPI, UploadFile, File, Form, Response
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import spacy
from typing import List
import json
from tempfile import NamedTemporaryFile
from resume_parser import resumeparse
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("all-mpnet-base-v2")

@app.post("/extract_and_sort")
async def extract_and_sort(job_description: str = Form(...), recruiter_skills: str = Form(...), resume_files: List[UploadFile] = File(...)):
    skills_list = json.loads(recruiter_skills)
    
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

            with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(contents)
                tmp_file_path = tmp_file.name

            parsed_data = resumeparse.read_file(tmp_file_path)
            os.unlink(tmp_file_path)

            matched_skills, unmatched_skills = extract_skills_from_resume(parsed_data["skills"], skills_list)

            skill_score = calculate_skill_score(parsed_data["skills"], skills_list)

            total_score = (similarity + skill_score) / 2

            scores.append({"filename": file.filename, "score": total_score, "text": cleaned_text, "matched_skills": matched_skills, "unmatched_skills": unmatched_skills})
        else:
            return {"error": "Uploaded file is not a PDF"}

    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)
    return sorted_scores

def extract_skills_from_resume(resume_skills: List[str], recruiter_skills: List[str]) -> (List[str], List[str]):
    matched_skills = []
    unmatched_skills = []
    for skill in resume_skills:
        if skill.lower() in recruiter_skills:
            matched_skills.append(skill)
        else:
            unmatched_skills.append(skill)
    return matched_skills, unmatched_skills

def calculate_skill_score(resume_skills: List[str], recruiter_skills: List[str]) -> float:
    vectorizer = CountVectorizer(vocabulary=recruiter_skills, binary=True)
    resume_skills_text = ' '.join(resume_skills)
    resume_skills_vector = vectorizer.transform([resume_skills_text])
    recruiter_skills_vector = vectorizer.transform(recruiter_skills)
    similarity = cosine_similarity(resume_skills_vector, recruiter_skills_vector)[0]
    skill_score = sum(similarity) / len(similarity)
    return skill_score
