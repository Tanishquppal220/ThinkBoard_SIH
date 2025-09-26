import shutil
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
import librosa
from collections import Counter
from datetime import datetime, timedelta
from fastapi import Form, File, UploadFile
from starlette.requests import Request
import tempfile
from nlpmodel import predict_emotion
from mentalhealthmodel import depression_prediction
from depressiontestmodel import testResult
from aiChat import chat_with_ai, simple_ai_chat, check_api_health
from voiceToText import speech_to_text_from_file

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",
                   "http://localhost:5173", "http://127.0.0.1:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# In-memory store for user emotions
user_emotion_history = {}

# -------------------------------
# Request Schemas
# -------------------------------


class CameraRequest(BaseModel):
    user_id: str


class VoiceRequest(BaseModel):
    user_id: str
    file_url: str


class FormRequest(BaseModel):
    user_id: str
    phq9: list[int]
    gad7: list[int]

class TextAnalysisRequest(BaseModel):
    text: str

class AiChatRequest(BaseModel):
    message: str
    user_id: str = None
    user_context: dict = None
# -------------------------------
# Camera-based emotion detection
# -------------------------------
@app.post("/detect-emotion/camera")
def detect_emotion_camera(req: CameraRequest):
    user_id = req.user_id

    cap = cv2.VideoCapture(0)  # Open webcam
    if not cap.isOpened():
        return JSONResponse(content={"error": "Camera not accessible"}, status_code=500)

    emotions = ["happy", "sad", "angry", "neutral"]
    detected_emotion = "neutral"
    start_time = datetime.now()

    while (datetime.now() - start_time).seconds < 5:
        ret, frame = cap.read()
        if not ret:
            break
        detected_emotion = np.random.choice(emotions)

    cap.release()

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "camera"
    }
    user_emotion_history.setdefault(user_id, []).append(entry)
    print(user_emotion_history)

    return {"user_id": user_id, "detected_emotion": detected_emotion, "history": user_emotion_history[user_id]}


# -------------------------------
# Voice-based emotion detection
# -------------------------------
@app.post("/detect-emotion/voice")
async def detect_emotion_voice(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file:
        return JSONResponse(content={"error": "No file uploaded"}, status_code=400)

    try:
        print("Got user_id:", user_id)
        print("Got file:", file.filename, file.content_type)

        contents = await file.read()
        # librosa requires a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        y, sr = librosa.load(tmp_path, sr=None)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)

        emotions = ["happy", "sad", "angry", "neutral"]
        detected_emotion = np.random.choice(emotions)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "voice"
    }
    user_emotion_history.setdefault(user_id, []).append(entry)

    return {
        "user_id": user_id,
        "detected_emotion": detected_emotion,
        "history": user_emotion_history[user_id]


    }
# -------------------------------
# Form-based emotion detection
# -------------------------------


@app.post("/detect-emotion/form")
def detect_emotion_form(req: FormRequest):
    user_id = req.user_id

    # calculate totals
    phq9_score = sum(req.phq9)
    gad7_score = sum(req.gad7)

    # Simple mapping from scores → emotion
    if phq9_score <= 4 and gad7_score <= 4:
        detected_emotion = "happy"
    elif phq9_score >= 15 or gad7_score >= 15:
        detected_emotion = "sad"
    elif gad7_score >= 10:
        detected_emotion = "angry"
    else:
        detected_emotion = "neutral"

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "form",
        "phq9_score": phq9_score,
        "gad7_score": gad7_score
    }
    user_emotion_history.setdefault(user_id, []).append(entry)

    return {
        "user_id": user_id,
        "detected_emotion": detected_emotion,
        "phq9_score": phq9_score,
        "gad7_score": gad7_score,
        "history": user_emotion_history[user_id]
    }

# -------------------------------
# Get User Emotion History
# -------------------------------


@app.get("/emotion-history/{user_id}")
def get_emotion_history(user_id: str):
    history = user_emotion_history.get(user_id, [])
    if not history:
        return {
            "user_id": user_id,
            "message": "No emotion data available."
        }

    cutoff_date = datetime.now() - timedelta(days=30)
    recent_history = [
        entry for entry in history
        if datetime.fromisoformat(entry["timestamp"]) >= cutoff_date
    ]

    if not recent_history:
        return {
            "user_id": user_id,
            "message": "No emotion data available in the last 30 days."
        }

    # --- DAILY EMOTIONS (group by date) ---
    daily = {}
    for entry in recent_history:
        day = datetime.fromisoformat(entry["timestamp"]).strftime("%Y-%m-%d")
        daily.setdefault(day, []).append(entry["emotion"])

    daily_summary = {
        day: Counter(emotions).most_common(1)[0][0]  # top emotion of the day
        for day, emotions in daily.items()
    }

    # --- WEEKLY EMOTIONS ---
    weekly = {}
    for entry in recent_history:
        year, week, _ = datetime.fromisoformat(
            entry["timestamp"]).isocalendar()
        week_key = f"{year}-W{week}"
        weekly.setdefault(week_key, []).append(entry["emotion"])

    weekly_summary = {
        week: Counter(emotions).most_common(1)[0][0]
        for week, emotions in weekly.items()
    }

    # --- MONTHLY EMOTIONS ---
    monthly = {}
    for entry in recent_history:
        month_key = datetime.fromisoformat(
            entry["timestamp"]).strftime("%Y-%m")
        monthly.setdefault(month_key, []).append(entry["emotion"])

    monthly_summary = {
        month: Counter(emotions).most_common(1)[0][0]
        for month, emotions in monthly.items()
    }

    # --- TOP EMOTIONS (last 30 days overall) ---
    emotion_counts = Counter(entry["emotion"] for entry in recent_history)
    top_emotions = emotion_counts.most_common(2)

    return {
        "user_id": user_id,
        "daily_summary": daily_summary,       # each day’s top emotion
        "weekly_summary": weekly_summary,     # each week’s top emotion
        "monthly_summary": monthly_summary,   # each month’s top emotion
        "top_emotions_last_30_days": top_emotions,
        "total_entries_analyzed": len(recent_history)
    }


# -------------------------------
# NLP-based emotion detection
# -------------------------------
@app.post("/analyze-text-emotion")
def analyze_text(req: TextAnalysisRequest):

    text = req.text
    if not text or text.strip() == "":
        return JSONResponse(content={"error": "Text input is empty"}, status_code=400)

    try:
        predicted_emotions = predict_emotion(text)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    d = {
        "input_text": text,
        "predicted_emotions": predicted_emotions
    }

    return d

# -------------------------------
# Depression Prediction
# -------------------------------
@app.post("/depresion-test")
def depresion_test(d: dict):
    try:
        result = depression_prediction(d)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    return {"input": d, "depression_prediction": result}


# -------------------------------
# PHQ-9 and GAD-7 Test Result
# -------------------------------
@app.post("/phq-gad-test")
def phqAndGadTest(d: dict):
    try:
        result = testResult(d)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    return {"input": d, "phq_gad_result": result}


# -------------------------------
# AI Chat Endpoints
# -------------------------------

@app.post("/ai-chat")
async def ai_chat_endpoint(req: AiChatRequest):
    """
    AI Chat endpoint that connects to Gemini API with personalization
    """
    try:
        if not req.message or not req.message.strip():
            return JSONResponse(content={"error": "Message cannot be empty"}, status_code=400)

        # Use the chat_with_ai function from aiChat.py with user context
        result = await chat_with_ai(req.message, req.user_id, req.user_context)

        return {
            "success": True,
            "response": result["response"],
            "user_message": req.message,
            "user_id": req.user_id,
            "model": result["model"],
            "personalized": result.get("personalized", False)
        }

    except Exception as e:
        return JSONResponse(
            content={"error": f"AI Chat failed: {str(e)}"},
            status_code=500
        )


@app.post("/ai-chat/simple")
async def simple_ai_chat_endpoint(req: AiChatRequest):
    """
    Simplified AI Chat endpoint for quick responses
    """
    try:
        if not req.message or not req.message.strip():
            return JSONResponse(content={"error": "Message cannot be empty"}, status_code=400)

        # Use the simple_ai_chat function
        response = await simple_ai_chat(req.message)

        return {
            "success": True,
            "response": response,
            "user_message": req.message
        }

    except Exception as e:
        return JSONResponse(
            content={"error": f"Simple AI Chat failed: {str(e)}"},
            status_code=500
        )


@app.get("/ai-chat/health")
def ai_chat_health():
    """
    Health check endpoint for AI Chat service
    """
    try:
        health_status = check_api_health()
        return health_status
    except Exception as e:
        return JSONResponse(
            content={"status": "error",
                     "message": f"Health check failed: {str(e)}"},
            status_code=500
        )

@app.post("/voice-recognition/")
async def voice_recognition(audio: UploadFile = File(...)):
    # Save the uploaded file
    with open("voice.wav", "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
    recognized_text = speech_to_text_from_file("voice.wav")
    nlp_result = predict_emotion(recognized_text)
    print(nlp_result)
    return nlp_result