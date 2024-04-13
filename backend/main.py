from fastapi import FastAPI, UploadFile, File, Form, Response
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
# import spacy
from typing import List
import json
import csv
import random
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from resume_parser import resumeparse
import os
from tempfile import NamedTemporaryFile
from fuzzywuzzy import fuzz
import re
import joblib
import zipfile

logisticRegressionModel = joblib.load('Python Scripts/logistic_regression_model.pkl')
logisticRegressionvectorizer = joblib.load('Python Scripts/count_vectorizer.pkl')


            
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
    recruiter_skills = json.loads(recruiter_skills)
    # print(recruiter_skills)
    # print("from first")
    # print(type(skills_list))
    # print(type(skills_list))
    

    scores = []
    all_files=[]

    for file in resume_files:
        if file.filename.endswith('.pdf'):

            #reading file-----------------------------------------------------------------------------------------
            contents = await file.read()
            reader = PdfReader(BytesIO(contents))
            page = reader.pages[0]
            text = page.extract_text()
            # nlp = spacy.load('en_core_web_sm')
            # cleaned_text = ' '.join([token.text for token in nlp(text) if not token.is_stop])
            # print("\n\n\I am printing text")
            # print(cleaned_text)
            #-----------------------------------------------------------------------------------------

            #embading models and finding similarity ---------------------------------------------------------------

            emb_1 = model.encode(text)
            emb_2 = model.encode(job_description)
            similarity = round(util.pytorch_cos_sim(emb_1, emb_2).item(), 3)

            print(file.filename)
            all_files.append(file.filename)
            # print("similarity: ",similarity)
            # print("skill score: ",skill_score)
            # total_score = similarity

            with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(contents)
                tmp_file_path = tmp_file.name
            #-----------------------------------------------------------------------------------------

            #extracting data from resume --------------------------------------------------------------

            # Process the temporary file
            parsed_data = resumeparse.read_file(tmp_file_path)
            print(parsed_data)
            os.unlink(tmp_file_path)  # Delete the temporary file

            #get cleaned skills
            resume_extracted_skills = getCleanedSkills(parsed_data['skills'])
            user_mail=parsed_data['email']
            print(user_mail)
            #-----------------------------------------------------------------------------------------

            #getting score ----------------------------------------------------------------------------
            skill_score_response = calculate_skill_score(resume_extracted_skills,recruiter_skills)
            skill_score = skill_score_response["skill_score"]
            matched_skills = skill_score_response["matched_skills"]
            unmatched_skills = skill_score_response["unmatched_skills"]
            # print("final response unmatched skills: ",unmatched_skills)
            
            print("Total responce",skill_score_response)
            # print("Siilarity score: ",similarity)
            # print("Skill score: ",skill_score)
            total_score = round((similarity + skill_score) /2,4)

            scores.append({"filename": file.filename, "score": total_score, "text":text , "matched_skills": matched_skills, "unmatched_skills": unmatched_skills, "all_skills":resume_extracted_skills, "user_mail":user_mail})
        else:
            return {"error": "Uploaded file is not a PDF"}

    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)
    print("\n\n")
    return sorted_scores

@app.post("/download/{filename}")
async def download_pdf(filename: str):
    try:
        with open(filename, "rb") as file:
            contents = file.read()
        return Response(content=contents, media_type="application/pdf")
    except FileNotFoundError:
        return {"error": "File not found"}

@app.post("/download-all")
async def download_all_pdfs(filenames: List[str]):
    try:
        zip_filename = "all_files.zip"
        with zipfile.ZipFile(zip_filename, "w") as zipf:
            for filename in filenames:
                with open(filename, "rb") as file:
                    zipf.write(filename)
        return FileResponse(zip_filename, media_type="application/zip", filename=zip_filename)
    except Exception as e:
        print("Error:", e)
        return {"error": "Failed to download files"}

def calculate_skill_score(resume_skills: List[str], recruiter_skills: List[str]) -> float:
    
    matched_skills=[]
    unmatched_skills=[]
    for resume_skill in resume_skills:
        isMatched= False
            
        for recruiter_skill in recruiter_skills:
            similarity_ratio = fuzz.ratio(resume_skill.lower(), recruiter_skill.lower())
            # print(resume_skill,' ',recruiter_skill,' ',similarity_ratio)
            if similarity_ratio >= 60:  # Set a threshold for similarity
                if resume_skill.strip() not in matched_skills:
                    matched_skills.append(resume_skill.strip())
                isMatched=True
                break
        if not isMatched:
            unmatched_skills.append(resume_skill.strip())        

    vectorizer = CountVectorizer(vocabulary=recruiter_skills, binary=True)
    resume_skills_text = ' '.join(resume_skills)
    resume_skills_vector = vectorizer.transform([resume_skills_text])
    recruiter_skills_vector = vectorizer.transform(recruiter_skills)
    similarity = cosine_similarity(resume_skills_vector, recruiter_skills_vector)[0]
    skill_score = sum(similarity) / len(similarity)
    skill_score=0.5
    
    # print("Resume extracted skills form calculate skill score function: ",resume_skills)
    # print("recruiter_skills: ",recruiter_skills)
    # print("from function for unmatched : ",unmatched_skills)
    return {"skill_score":skill_score, "matched_skills":matched_skills, "unmatched_skills":unmatched_skills}

def getCleanedSkills(resume_skills: List[str]) -> List[str]:
    # cleaned_skills = []
    true_cleaned_skills = []

    for skill in resume_skills:
        # Remove any non-alphanumeric characters and convert to lowercase
        cleaned_skill = re.sub(r'[^a-zA-Z0-9\s]', '', skill.lower())
        # Filter out very long strings (assuming skills are not extremely long)
        # if len(cleaned_skill) < 100:  # You can adjust the threshold as needed
        #     cleaned_skills.append(cleaned_skill.strip())
        # else:
        #     print("I am discarded: ", cleaned_skill)

        skills_vectorized = logisticRegressionvectorizer.transform([cleaned_skill])
        prediction = logisticRegressionModel.predict(skills_vectorized)

        if prediction == 1:
            true_cleaned_skills.append(cleaned_skill.strip())
            # print("I am accepted because of 1 prediction: ", cleaned_skill)
        else:
            print("I am discarded because of 0 prediction: ", cleaned_skill)

    return true_cleaned_skills
