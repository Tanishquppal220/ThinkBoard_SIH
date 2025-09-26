import joblib
import spacy
from spacy.lang.en import English
from spacy.lang.en.stop_words import STOP_WORDS
import string
import re
from sklearn.metrics import accuracy_score

cols = ['afraid', 'angry', 'anxious', 'ashamed', 'awkward', 'bored',
        'calm', 'confused', 'disgusted', 'excited', 'frustrated', 'happy',
        'jealous', 'nostalgic', 'proud', 'sad', 'satisfied', 'surprised',
        'exercise', 'family', 'food', 'friends', 'god', 'health', 'love',
        'recreation', 'school', 'sleep', 'work']

models = {}
for col in cols:
    models[col] = joblib.load(f"./trained_models/NLP/modelnlp{col}.pkl")
cv = joblib.load(r"./trained_models/NLP/cv.pkl")

nlp_eng = English()
stop_words = STOP_WORDS


def clean_sent(text):
    cleaned = text.lower()
    cleaned = re.sub("[ ]+", " ", cleaned)
    cleaned = re.sub("^ ", "", cleaned)
    cleaned = re.sub("[^a-zA-Z0-9 ']", "", cleaned)

    my_doc = nlp_eng(cleaned)
    token_list = []
    for token in my_doc:
        token_list.append(token.text)

    filtered_sent = []
    for word in token_list:
        lexeme = nlp_eng.vocab[word]
        if lexeme.is_stop == False:
            filtered_sent.append(word)

    cleaned = filtered_sent
    return " ".join(cleaned)


def predict_emotion(InputText):
    text = InputText
    text = clean_sent(text)
    text = cv.transform([text])

    prediction = []
    for col in cols:
        pred = models[col].predict(text)
        if (pred[0]):
            prediction.append(col)
    return prediction
