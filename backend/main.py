from fastapi import FastAPI, UploadFile, File, Form
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util
import spacy
from typing import List

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
    return {"Hello": "World"}

@app.post("/extract_and_sort")
async def extract_and_sort(job_description: str = Form(...), resume_files: List[UploadFile] = File(...)):
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
            print(cleaned_text)
            print(text)
            print(job_description)
            
            similarity = round(util.pytorch_cos_sim(emb_1, emb_2).item(), 3)

            scores.append({"filename": file.filename, "score": similarity})
        else:
            return {"error": "Uploaded file is not a PDF"}

    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)
    return sorted_scores
