import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
import joblib

# Load the dataset
dataset = pd.read_csv('skills_dataset.csv')
# print(dataset)
# Replace NaN values with empty strings
dataset['skill'] = dataset['skill'].fillna('')
dataset['is_skill'] = dataset['is_skill'].fillna(0)

# Vectorize the skills using CountVectorizer
vectorizer = CountVectorizer()
X_vectorized = vectorizer.fit_transform(dataset['skill'])
y=dataset['is_skill']

# Split the dataset into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(dataset['skill'], dataset['is_skill'], test_size=0.2, random_state=42)

# Train an SVM model
# model = SVC(kernel='linear', C=1.0)
# model.fit(X_train_vectorized, y_train)

# Train a logistic regression model
model = LogisticRegression()
model.fit(X_vectorized, y)

joblib.dump(model, 'logistic_regression_model.pkl')
joblib.dump(vectorizer, 'count_vectorizer.pkl')

# Make predictions on the test set
# y_pred = model.predict(X_test_vectorized)

# Calculate the accuracy of the model
# accuracy = accuracy_score(y_test, y_pred)
# print(f"Accuracy: {accuracy}")

# Function to predict whether a given word is a skill or not
def predict_skill(word):
    word_vectorized = vectorizer.transform([word])
    prediction = model.predict(word_vectorized)[0]
    return prediction

# Test the function
word = ["parth","vyom","reactjs","nodejs","time management"]
for i in word:
    prediction = predict_skill(i)
    print(f"Is '{i}' a skill? {prediction}")
