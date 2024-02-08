from fastapi import FastAPI, UploadFile, File, Query
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer , util
from sklearn.metrics.pairwise import cosine_similarity
# from nltk.translate import paraphrase
import spacy
from typing import List  # Import List type from the typing module


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with the list of allowed origins if you know them
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Sentence Transformer model
# model = SentenceTransformer("all-MiniLM-L6-v2")
model = SentenceTransformer("all-mpnet-base-v2")


@app.get("/")
def read_root():
    return {"Hello": "World18"}

@app.post("/extract_and_sort")
async def extract_and_sort(resume_files: List[UploadFile] = File(...)):
    scores = []

    for file in resume_files:
        if file.filename.endswith('.pdf'):
            # Read the PDF file
            contents = await file.read()
            reader = PdfReader(BytesIO(contents))  # Pass BytesIO object to PdfReader
            
            # Extract text from the first page
            page = reader.pages[0]
            text = page.extract_text()
            nlp = spacy.load('en_core_web_sm')
            cleaned_text = ' '.join([token.text for token in nlp(text) if not token.is_stop])
            # print("cleaned text: ",cleaned_text)

            job_description= "i want python and react developer"
            # print(paraphrase.phrase("I want a Python and React developer."))


            emb_1 = model.encode(text)
            emb_2 = model.encode(job_description)
            # similarity = util.cos_sim(emb_1, emb_2)
            similarity = round(util.pytorch_cos_sim(emb_1, emb_2).item() , 3)  # Convert tensor to Python float
            
             # Append score and filename to scores list
            scores.append({"filename": file.filename, "score": similarity})
        else:
            return {"error": "Uploaded file is not a PDF"}
    
    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)
    return sorted_scores
