import React, { useRef, useState } from "react";
import RecordRTC from "recordrtc";

function VoiceRecognitionPage() {
  const recorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [backendResult, setBackendResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    setBackendResult(null);
    setAudioURL(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorderRef.current = new RecordRTC(stream, {
      type: "audio",
      mimeType: "audio/wav",
      recorderType: RecordRTC.StereoAudioRecorder,
      desiredSampRate: 16000,
    });
    recorderRef.current.startRecording();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      setAudioURL(URL.createObjectURL(blob));
      uploadAudio(blob);
      setRecording(false);
    });
  };

  const uploadAudio = async (audioBlob) => {
    setLoading(true);
    setBackendResult(null);
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice.wav");
    // Insert APi here
    try {
      const response = await fetch("http://127.0.0.1:8000/voice-recognition/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setBackendResult(data);
    } catch (err) {
      setBackendResult({ error: "Upload failed or backend error " + JSON.stringify(err) });
    }
    setLoading(false);
  };
  console.log(backendResult)

  // Stop microphone stream when recording stops
  React.useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.stream) {
        recorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: 540, margin: "40px auto", fontFamily: "sans-serif", padding: 24, border: "1px solid #ddd", borderRadius: 12, background: "#fafcff" }}>
      <h2>🎤 Voice Recognition Demo</h2>
      <p>Record your voice and send it to the backend for speech recognition and NLP.</p>
      <div style={{ margin: "20px 0" }}>
        <button
          onClick={recording ? stopRecording : startRecording}
          style={{
            padding: "10px 28px",
            fontSize: 18,
            borderRadius: 8,
            border: "none",
            background: recording ? "#e74c3c" : "#3498db",
            color: "#fff",
            cursor: "pointer",
            marginRight: 16,
          }}>
          {recording ? "⏹ Stop Recording" : "⏺ Start Recording"}
        </button>
        {loading && <span style={{ fontSize: 16 }}>⏳ Processing...</span>}
      </div>
      {audioURL && (
        <div style={{ margin: "20px 0" }}>
          <audio controls src={audioURL} style={{ width: "100%" }} />
        </div>
      )}
      {backendResult && (
        <div style={{ background: "#f4f8fa", padding: 16, borderRadius: 8, marginTop: 16 }}>
          <strong>Detected Emotions:</strong>
          <div style={{ margin: "8px 0", color: "#34495e" }}>
            {Array.isArray(backendResult)
              ? backendResult.length > 0
                ? backendResult.map((emotion, idx) => (
                    <span key={idx} style={{ marginRight: 8, padding: "4px 10px", background: "#d1ecf1", borderRadius: 6, display: "inline-block" }}>
                      {emotion}
                    </span>
                  ))
                : <span>No emotions detected.</span>
              : <span>{typeof backendResult === "string" ? backendResult : JSON.stringify(backendResult)}</span>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceRecognitionPage;