from fastapi import FastAPI, UploadFile, File
from PyPDF2 import PdfReader
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with the list of allowed origins if you know them
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/extract_text")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    # Check if the uploaded file is a PDF
    if file.filename.endswith('.pdf'):
        # Read the PDF file
        contents = await file.read()
        reader = PdfReader(BytesIO(contents))  # Pass BytesIO object to PdfReader
        
        # Extract text from the first page
        page = reader.pages[0]
        text = page.extract_text()
        
        return {"text": text}
    else:
        return {"error": "Uploaded file is not a PDF"}
