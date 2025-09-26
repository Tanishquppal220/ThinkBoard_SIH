import joblib
import re
import pandas as pd

cols = ['Gender', 'Age', 'City', 'Profession', 'CGPA', 'Study Satisfaction',
        'Job Satisfaction', 'Sleep Duration', 'Dietary Habits', 'Degree',
        'suicidal thoughts', 'Work Study Hours',
        'Financial Stress', 'Family History of Mental Illness',
        'Work Related Pressure']

model = joblib.load("./trained_models/depression_test/model_depression.pkl")
label_encoders = {}
for col in cols:
    label_encoders[col] = joblib.load(f"./trained_models/depression_test/{col}_encoder.pkl")


def clean(text):
    if type(text) == str:
        cleaned = text.lower()
        cleaned = re.sub("[ ]+", " ", cleaned)
        cleaned = re.sub("^ ", "", cleaned)
        cleaned = re.sub("[^a-zA-Z0-9 ']", "", cleaned)
        return "".join(cleaned)

def depression_prediction(InputDict):
  print(InputDict)
  input_data = InputDict['additionalProp1']
  input_df = pd.DataFrame([input_data])
  print(input_df.columns)

# {"Gender":"Female", "Age":24, "City":"Bangalore", "Profession":"Student", "Academic Pressure":2.0, "Work Pressure":0, "CGPA":5.90, "Study Satisfaction":5, "Job Satisfaction":0, "Sleep Duration":"'5-6 hours'", "Dietary Habits":"Moderate" , "Degree":"BSc" , "Have you ever had suicidal thoughts ?":"No" , "Work Study Hours":3 , "Financial Stress":2 , "Family History of Mental Illness":"Yes"}
  # Apply the same transformations to input_df as were applied to x
  input_df['Work Related Pressure'] = input_df['Work Pressure'] + input_df["Academic Pressure"]
  
  input_df = input_df.drop(['Work Pressure', 'Academic Pressure'], axis=1)
  for col in input_df.columns:
      input_df[col] = input_df[col].apply(lambda x: clean(x))
  for col in input_df.columns:
      if col in label_encoders:
          input_df[col] = label_encoders[col].transform(input_df[col])
      if col == "Have you ever had suicidal thoughts ?":
          input_df[col] = label_encoders["suicidal thoughts"].transform(
              input_df[col])
  pred = model.predict(input_df)[0]

  return "Depressed" if pred == 1 else "Not Depressed"
