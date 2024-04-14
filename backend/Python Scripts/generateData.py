import os
from resume_parser import resumeparse
import csv

# Path to the folder containing resumes
resumes_folder = 'C:/SEM6/Assignent/ML/backend/resumes'

# Path to the CSV file
csv_file = 'C:/SEM6/Assignent/ML/Backend/Python Scripts/skills_dataset.csv'

# Open the CSV file in append mode
with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)

    # Iterate over the files in the resumes folder
    for filename in os.listdir(resumes_folder):
        if filename.endswith('.pdf'):
            print(filename)
            # Process the resume file
            resume_path = os.path.join(resumes_folder, filename)
            parsed_data = resumeparse.read_file(resume_path)

            # Extract the skills from the resume
            skills = parsed_data.get('skills', [])

            # Write each skill to the CSV file
            for skill in skills:
                # Ask the user for input (1 for relevant, 0 for not relevant)
                # is_skill_relevant = input(f"Is '{skill}' a relevant skill? (1/0): ")

                # Write the skill and the user's input to the CSV file
                writer.writerow([skill])
print("done")
