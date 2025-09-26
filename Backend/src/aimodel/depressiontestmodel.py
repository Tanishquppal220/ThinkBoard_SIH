
import joblib
import pandas as pd

model = joblib.load("./trained_models/PHQandGAD_Test/modeltest.pkl")
def testResult(d:dict):
  inputData = d["additionalProp1"]
  inputData['Gender']=inputData['Gender'].lower()
  if inputData['Gender'] == "female" or inputData['Gender'] == "f":
    inputData['Gender'] = 0
  else:
    inputData['Gender'] = 1
  inputData = pd.DataFrame(inputData, index=[0])
  pred = model.predict(inputData)[0]
  level = {0: "Mild", 1: "Moderate", 2: "Normal", 3: "Severe"}
  return level.get(pred, "Unknown")

