import os
from resume_parser import resumeparse
import csv
import joblib
import pandas as pd

# Path to the folder containing resumes
resumes_folder = 'C:/SEM6/Assignent/ML/backend/resumes/new'

# Load the trained model and CountVectorizer
model = joblib.load('logistic_regression_model.pkl')
vectorizer = joblib.load('count_vectorizer.pkl')

# Open the CSV file in append mode
for filename in os.listdir(resumes_folder):
    if filename.endswith('.pdf'):
        print(filename)
        # Process the resume file
        resume_path = os.path.join(resumes_folder, filename)
        parsed_data = resumeparse.read_file(resume_path)

        # Extract the skills from the resume
        skills = parsed_data.get('skills', [])
        skills_vectorized = vectorizer.transform(skills)

        predictions = model.predict(skills_vectorized)
        for skill, prediction in zip(skills, predictions):
                print(skill,prediction)


print("done")