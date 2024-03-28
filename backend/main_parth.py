from fastapi import FastAPI, UploadFile, File, Form, Response
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import spacy
from typing import List
import json
import csv
import random
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from resume_parser import resumeparse
import os
from tempfile import NamedTemporaryFile
            
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
async def extract_and_sort(job_description: str = Form(...), recruiter_skills: str = Form(...), resume_files: List[UploadFile] = File(...)):
    skills_list = json.loads(recruiter_skills)
    # print(recruiter_skills)
    # print("from first")
    # print(type(skills_list))
    # print(type(skills_list))
    

    scores = []

    for file in resume_files:
        if file.filename.endswith('.pdf'):
            contents = await file.read()
            reader = PdfReader(BytesIO(contents))
            page = reader.pages[0]
            text = page.extract_text()
            nlp = spacy.load('en_core_web_sm')
            cleaned_text = ' '.join([token.text for token in nlp(text) if not token.is_stop])
            # print(cleaned_text)

            emb_1 = model.encode(cleaned_text)
            emb_2 = model.encode(job_description)
            similarity = round(util.pytorch_cos_sim(emb_1, emb_2).item(), 3)

            print(file.filename)
            # print("similarity: ",similarity)
            # print("skill score: ",skill_score)
            # total_score = similarity

            with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(contents)
                tmp_file_path = tmp_file.name

            # Process the temporary file
            parsed_data = resumeparse.read_file(tmp_file_path)
            os.unlink(tmp_file_path)  # Delete the temporary file
            
            skill_score_response = calculate_skill_score(parsed_data["skills"],skills_list)
            skill_score = skill_score_response["skill_score"]
            matched_skills = skill_score_response["matched_skills"]
            unmatched_skills = skill_score_response["unmatched_skills"]
            print("Total responce",skill_score_response)
            # print("Siilarity score: ",similarity)
            # print("Skill score: ",skill_score)
            total_score = ((similarity + skill_score) /2).round(3)

            scores.append({"filename": file.filename, "score": total_score, "text":cleaned_text , "matched_skills": matched_skills, "unmatched_skills": unmatched_skills, "all_skills":parsed_data["skills"]})
        else:
            return {"error": "Uploaded file is not a PDF"}

    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)
    print("\n\n")
    return sorted_scores

@app.get("/download/{filename}")
async def download_pdf(filename: str):
    try:
        with open(filename, "rb") as file:
            contents = file.read()
        return Response(content=contents, media_type="application/pdf")
    except FileNotFoundError:
        return {"error": "File not found"}

def calculate_skill_score(resume_skills: List[str], recruiter_skills: List[str]) -> float:
    # print("Resume extracted skills: ",resume_skills)
    # print("recruiter_skills: ",recruiter_skills)
    vectorizer = CountVectorizer(vocabulary=recruiter_skills, binary=True)
    resume_skills_text = ' '.join(resume_skills)
    resume_skills_vector = vectorizer.transform([resume_skills_text])
    recruiter_skills_vector = vectorizer.transform(recruiter_skills)
    print("BOth vector: ")
    print(resume_skills_vector)
    print("done")
    print(recruiter_skills_vector)
    similarity = cosine_similarity(resume_skills_vector, recruiter_skills_vector)[0]
    print("Similarity",similarity)
    print("similarity 0th element: ",similarity[0])
    skill_score = sum(similarity) / len(similarity)
    
    matched_skills = [skill for skill, score in zip(resume_skills, similarity) if score > 0.6]
    unmatched_skills = [skill for skill, score in zip(resume_skills, similarity) if score == 0]
    
    print("from function: ",matched_skills)
    return {"skill_score":skill_score, "matched_skills":matched_skills, "unmatched_skills": unmatched_skills}

# def calculate_skill_score(text: str, skills: List[str]) -> float:
#     # print(text)
#     # print(skills)
#     # skill_score=0.5
#     vectorizer = CountVectorizer(vocabulary=skills, binary=True)
#     text_vector = vectorizer.fit_transform([text])
#     skills_vector = vectorizer.transform(skills)
#     # print("text_vector: ",text_vector)
#     # print("skills_vector: ",skills_vector)
#     similarity = cosine_similarity(text_vector, skills_vector)[0]
#     # print("similarity: ",similarity)
#     skill_score = sum(similarity)/len(similarity)
#     return skill_score

# def calculate_skill_score(text: str, skills: List[str]) -> float:
#     # This function calculates the skill match score based on the presence of skills in the text
#     skill_count = sum(1 for skill in skills if skill.lower() in text.lower())
#     skill_score = (skill_count / len(skills)) * 100  # Percentage of skills matched
#     return round(skill_score, 2)
