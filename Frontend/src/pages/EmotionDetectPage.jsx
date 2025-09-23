import React, { useContext, useState, useRef } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { Camera, Mic, FileText, Play, Square, AlertCircle, CheckCircle, Loader2, TrendingUp, Calendar, BarChart3, History } from "lucide-react";

const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things.",
  "Feeling down, depressed, or hopeless.",
  "Trouble falling or staying asleep, or sleeping too much.",
  "Feeling tired or having little energy.",
  "Poor appetite or overeating.",
  "Feeling bad about yourself – or that you are a failure or have let yourself or your family down.",
  "Trouble concentrating on things, such as reading the newspaper or watching television.",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual.",
  "Thoughts that you would be better off dead, or of hurting yourself in some way."
];

const GAD7_ITEMS = [
  "Feeling nervous, anxious or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const DIFFICULTY_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult"
];

// Emoji mapping for emotions
const EMOTION_EMOJIS = {
  'happy': '😊',
  'joy': '😄',
  'excited': '🤩',
  'content': '😌',
  'calm': '😇',
  'neutral': '😐',
  'sad': '😢',
  'angry': '😠',
  'frustrated': '😤',
  'anxious': '😰',
  'worried': '😟',
  'depressed': '😞',
  'fear': '😨',
  'disgust': '🤢',
  'surprise': '😲',
  'confused': '😕',
  'tired': '😴',
  'stressed': '😣'
};

const getEmotionEmoji = (emotion) => {
  if (!emotion) return '😐';
  const normalizedEmotion = emotion.toLowerCase();
  return EMOTION_EMOJIS[normalizedEmotion] || '😐';
};

const getEmotionColor = (emotion) => {
  if (!emotion) return '#94a3b8';
  const positiveEmotions = ['happy', 'joy', 'excited', 'content', 'calm'];
  const negativeEmotions = ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'depressed', 'fear'];
  
  if (positiveEmotions.includes(emotion.toLowerCase())) {
    return '#22c55e'; // green
  } else if (negativeEmotions.includes(emotion.toLowerCase())) {
    return '#ef4444'; // red
  }
  return '#f59e0b'; // yellow for neutral
};

const EmotionDetectPage = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { userData, backendUrl } = useContext(AppContent);

  // recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // form states
  const [phq9, setPhq9] = useState(Array(PHQ9_ITEMS.length).fill(0));
  const [gad7, setGad7] = useState(Array(GAD7_ITEMS.length).fill(0));
  const [difficulty, setDifficulty] = useState(DIFFICULTY_OPTIONS[0]);

  const phq9Total = phq9.reduce((a, b) => a + b, 0);
  const gad7Total = gad7.reduce((a, b) => a + b, 0);

  // -------------------------
  // Camera Detection
  // -------------------------
  const handleCameraDetect = async () => {
    if (!userData || !userData._id) {
      setResult({ error: "Please log in first." });
      return;
    }

    setLoading(true);
    setActiveMethod('camera');
    setResult(null);
    
    try {
      const res = await axios.post(
        `${backendUrl}/api/emotion/camera`,
        { userId: userData._id },
        { headers: { "Content-Type": "application/json" } }
      );
      setResult(res.data);
    } catch (error) {
      console.error("Camera detection error:", error);
      setResult({ error: "Camera detection failed. Please try again." });
    } finally {
      setLoading(false);
      setActiveMethod(null);
    }
  };

  // -------------------------
  // Voice Recording
  // -------------------------
  const startRecording = async () => {
    if (!userData || !userData._id) {
      setResult({ error: "Please log in first." });
      return;
    }

    setResult(null);
    setIsRecording(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

        const formData = new FormData();
        formData.append("user_id", userData._id);
        formData.append("file", audioFile);

        try {
          setLoading(true);
          setActiveMethod('voice');
          const res = await axios.post(`${backendUrl}/api/emotion/voice`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          setResult(res.data);
        } catch (error) {
          console.error("Voice detection error:", error);
          setResult({ error: "Voice detection failed. Please try again." });
        } finally {
          setLoading(false);
          setActiveMethod(null);
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current.start();
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 5000);
    } catch (err) {
      console.error("Microphone error:", err);
      setResult({ error: "Microphone not accessible. Please check permissions." });
      setIsRecording(false);
    }
  };

  // -------------------------
  // Form Submit
  // -------------------------
  const handleFormDetect = async () => {
    if (!userData || !userData._id) {
      setResult({ error: "Please log in first." });
      return;
    }

    setLoading(true);
    setActiveMethod('form');
    setResult(null);
    
    try {
      const payload = {
        user_id: userData._id,
        phq9,
        gad7,
        difficulty
      };

      const res = await axios.post(`${backendUrl}/api/emotion/form`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      setResult(res.data);
    } catch (error) {
      console.error("Form detection error:", error);
      setResult({ error: "Form submission failed. Please try again." });
    } finally {
      setLoading(false);
      setActiveMethod(null);
    }
  };

  // -------------------------
  // Fetch Emotion History
  // -------------------------
  const fetchEmotionHistory = async () => {
    if (!userData || !userData._id) {
      setResult({ error: "Please log in first." });
      return;
    }

    setLoading(true);
    setActiveMethod('history');
    try {
      const res = await axios.get(`${backendUrl}/api/emotion/history/${userData._id}`);
      const data = res.data;

      if (data.message) {
        setResult({ error: data.message });
      } else {
        setResult(data);
        setShowHistory(true);
      }
    } catch (error) {
      console.error("Error fetching emotion history:", error.message);
      setResult({ error: "Failed to fetch emotion history" });
    } finally {
      setLoading(false);
      setActiveMethod(null);
    }
  };

  const getWeekdayMap = (dailySummary) => {
    const weekdayMap = {};
    Object.entries(dailySummary).forEach(([dateStr, emotion]) => {
      const day = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
      weekdayMap[day] = emotion;
    });
    return weekdayMap;
  };

  const getLatestEmotion = (summaryObj) => {
    const sortedKeys = Object.keys(summaryObj).sort();
    const latestKey = sortedKeys[sortedKeys.length - 1];
    return summaryObj[latestKey];
  };

  // Generate mock chart data for demonstration
  const generateChartData = (dailySummary) => {
    const chartData = [];
    const dates = Object.keys(dailySummary).sort().slice(-12); // Last 12 days
    
    dates.forEach((date, index) => {
      const emotion = dailySummary[date];
      const isPositive = ['happy', 'joy', 'excited', 'content', 'calm'].includes(emotion?.toLowerCase());
      const isNegative = ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'depressed'].includes(emotion?.toLowerCase());
      
      chartData.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        positive: isPositive ? Math.random() * 80 + 20 : Math.random() * 30,
        negative: isNegative ? Math.random() * 80 + 20 : Math.random() * 30,
        emotion: emotion
      });
    });
    
    return chartData;
  };

  // UI for each question
  const QuestionRow = ({ text, value, onChange, index, questionType = 'general' }) => (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 py-4 border-b border-base-300 last:border-b-0">
      <div className="flex-1 text-sm lg:text-base">
        <span className="font-medium text-primary">{index + 1}.</span> {text}
      </div>
      <div className="flex gap-2 justify-center lg:justify-end">
        {[0, 1, 2, 3].map((opt) => (
          <div key={opt} className="form-control">
            <label className="label cursor-pointer flex-col gap-1 p-2">
              <input
                type="radio"
                name={`${questionType}-q-${index}`}
                value={opt}
                checked={value === opt}
                onChange={(e) => {
                  e.preventDefault();
                  onChange(opt);
                }}
                className="radio radio-primary radio-sm"
              />
              <span className="text-xs font-medium">{opt}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const getSeverityBadge = (score, maxScore, type) => {
    let severity, colorClass;
    
    if (type === 'phq9') {
      if (score <= 4) { severity = 'Minimal'; colorClass = 'badge-success'; }
      else if (score <= 9) { severity = 'Mild'; colorClass = 'badge-warning'; }
      else if (score <= 14) { severity = 'Moderate'; colorClass = 'badge-warning'; }
      else if (score <= 19) { severity = 'Moderately Severe'; colorClass = 'badge-error'; }
      else { severity = 'Severe'; colorClass = 'badge-error'; }
    } else {
      if (score <= 4) { severity = 'Minimal'; colorClass = 'badge-success'; }
      else if (score <= 9) { severity = 'Mild'; colorClass = 'badge-warning'; }
      else if (score <= 14) { severity = 'Moderate'; colorClass = 'badge-warning'; }
      else { severity = 'Severe'; colorClass = 'badge-error'; }
    }
    
    return <span className={`badge ${colorClass} badge-sm`}>{severity}</span>;
  };

  // Emotion History Dashboard Component
  const EmotionDashboard = () => {
    if (!result || !result.daily_summary) return null;

    const weekdayMap = getWeekdayMap(result.daily_summary);
    const chartData = generateChartData(result.daily_summary);
    const weeklyEmotion = result.weekly_summary ? getLatestEmotion(result.weekly_summary) : null;
    const monthlyEmotion = result.monthly_summary ? getLatestEmotion(result.monthly_summary) : null;

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Weekly Emotion</div>
            <div className="stat-value text-primary flex items-center gap-2">
              <span className="text-4xl">{getEmotionEmoji(weeklyEmotion)}</span>
              <span className="text-lg capitalize">{weeklyEmotion || 'N/A'}</span>
            </div>
            <div className="stat-desc">Current week trend</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-title">Monthly Emotion</div>
            <div className="stat-value text-secondary flex items-center gap-2">
              <span className="text-4xl">{getEmotionEmoji(monthlyEmotion)}</span>
              <span className="text-lg capitalize">{monthlyEmotion || 'N/A'}</span>
            </div>
            <div className="stat-desc">Overall monthly mood</div>
          </div>
        </div>

        {/* Freud Score Chart */}
        <div className="card bg-gradient-to-br from-pink-400 to-green-400 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="card-title text-2xl mb-2 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Freud Score
                </h2>
                <p className="text-base-content/70">See your mental score insights</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Negative</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-64 mb-6">
              <div className="flex items-end justify-between h-full px-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center gap-1 flex-1 max-w-16">
                    <div className="flex flex-col items-center justify-end h-48 gap-1">
                      {/* Positive bar */}
                      <div 
                        className="w-6 bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                        style={{ height: `${data.positive}%` }}
                        title={`Positive: ${Math.round(data.positive)}%`}
                      ></div>
                      {/* Negative bar */}
                      <div 
                        className="w-6 bg-red-500 rounded-b transition-all duration-500 hover:bg-red-600"
                        style={{ height: `${data.negative}%` }}
                        title={`Negative: ${Math.round(data.negative)}%`}
                      ></div>
                    </div>
                    <span className="text-xs text-base-content/70 mt-2">{data.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="flex justify-between text-sm text-base-content/50 border-t pt-4">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </div>
        </div>

        {/* Mood History */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Mood History
            </h3>
            
            <div className="grid grid-cols-7 gap-4">
              {weekdays.map((day) => {
                const emotion = weekdayMap[day];
                const emoji = getEmotionEmoji(emotion);
                return (
                  <div key={day} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors">
                    <div className="text-3xl mb-1">{emoji}</div>
                    <span className="text-xs font-medium text-base-content/70">{day.slice(0, 3)}</span>
                    <span className="text-xs text-center capitalize px-2 py-1 rounded-full bg-base-100 text-base-content/80">
                      {emotion || 'No data'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        {/* <div className="card bg-gradient-to-r from-purple-100 to-blue-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI Suggestions</h3>
                  <p className="text-sm text-base-content/70">Swipe for personalized recommendations</p>
                </div>
              </div>
              <button className="btn btn-circle btn-outline">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-2">Emotion Detection</h1>
          <p className="text-base-content/70 text-lg">Choose your preferred method for emotion analysis</p>
        </div>

        {/* Show Dashboard if history is loaded */}
        {showHistory && result && result.daily_summary && !result.error ? (
          <EmotionDashboard />
        ) : (
          <>
            {/* Detection Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {/* Camera Detection */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="mx-auto mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h2 className="card-title justify-center text-xl mb-2">Camera Detection</h2>
                  <p className="text-base-content/70 mb-4">
                    Analyze facial expressions in real-time
                  </p>
                  <div className="card-actions justify-center">
                    <button
                      onClick={handleCameraDetect}
                      disabled={loading}
                      className={`btn btn-primary ${loading && activeMethod === 'camera' ? 'loading' : ''}`}
                    >
                      {loading && activeMethod === 'camera' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Camera className="w-4 h-4 mr-2" />
                      )}
                      Start Detection
                    </button>
                  </div>
                </div>
              </div>

              {/* Voice Detection */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="mx-auto mb-4">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Mic className="w-8 h-8 text-secondary" />
                    </div>
                  </div>
                  <h2 className="card-title justify-center text-xl mb-2">Voice Analysis</h2>
                  <p className="text-base-content/70 mb-4">
                    Record 5 seconds of speech for analysis
                  </p>
                  <div className="card-actions justify-center">
                    <button
                      onClick={startRecording}
                      disabled={loading || isRecording}
                      className={`btn btn-secondary ${isRecording ? 'loading' : ''}`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Recording...
                        </>
                      ) : loading && activeMethod === 'voice' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Assessment */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="mx-auto mb-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <h2 className="card-title justify-center text-xl mb-2">Clinical Assessment</h2>
                  <p className="text-base-content/70 mb-4">
                    PHQ-9 & GAD-7 standardized questionnaire
                  </p>
                  <div className="stats stats-horizontal shadow-sm mb-4">
                    <div className="stat py-2">
                      <div className="stat-title text-xs">PHQ-9</div>
                      <div className="stat-value text-lg">{phq9Total}</div>
                      <div className="stat-desc">{getSeverityBadge(phq9Total, 27, 'phq9')}</div>
                    </div>
                    <div className="stat py-2">
                      <div className="stat-title text-xs">GAD-7</div>
                      <div className="stat-value text-lg">{gad7Total}</div>
                      <div className="stat-desc">{getSeverityBadge(gad7Total, 21, 'gad7')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotion History */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="mx-auto mb-4">
                    <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center">
                      <History className="w-8 h-8 text-info" />
                    </div>
                  </div>
                  <h2 className="card-title justify-center text-xl mb-2">Emotion History</h2>
                  <p className="text-base-content/70 mb-4">
                    View your mood patterns and trends
                  </p>
                  <div className="card-actions justify-center">
                    <button
                      onClick={fetchEmotionHistory}
                      disabled={loading}
                      className={`btn btn-info ${loading && activeMethod === 'history' ? 'loading' : ''}`}
                    >
                      {loading && activeMethod === 'history' ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <History className="w-4 h-4 mr-2" />
                      )}
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PHQ-9 & GAD-7 Form */}
            {!showHistory && (
              <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-2" />
                    Clinical Assessment Form
                  </h2>

                  {/* PHQ-9 Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">PHQ-9 Depression Scale</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Total: {phq9Total}/27</span>
                        {getSeverityBadge(phq9Total, 27, 'phq9')}
                      </div>
                    </div>
                    <div className="bg-base-200 rounded-lg p-4">
                      <div className="text-xs text-base-content/70 mb-4 text-center">
                        Over the last 2 weeks, how often have you been bothered by any of the following problems?
                      </div>
                      <div className="hidden lg:flex justify-end gap-2 mb-2 text-xs font-medium text-base-content/70">
                        <span className="w-12 text-center">Not at all</span>
                        <span className="w-12 text-center">Several days</span>
                        <span className="w-12 text-center">More than half</span>
                        <span className="w-12 text-center">Nearly every day</span>
                      </div>
                      {PHQ9_ITEMS.map((q, i) => (
                        <QuestionRow
                          key={`phq9-${i}`}
                          text={q}
                          value={phq9[i]}
                          onChange={(opt) => {
                            const newArr = [...phq9];
                            newArr[i] = opt;
                            setPhq9(newArr);
                          }}
                          index={i}
                          questionType="phq9"
                        />
                      ))}
                    </div>
                  </div>

                  {/* GAD-7 Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">GAD-7 Anxiety Scale</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Total: {gad7Total}/21</span>
                        {getSeverityBadge(gad7Total, 21, 'gad7')}
                      </div>
                    </div>
                    <div className="bg-base-200 rounded-lg p-4">
                      <div className="text-xs text-base-content/70 mb-4 text-center">
                        Over the last 2 weeks, how often have you been bothered by the following problems?
                      </div>
                      {GAD7_ITEMS.map((q, i) => (
                        <QuestionRow
                          key={`gad7-${i}`}
                          text={q}
                          value={gad7[i]}
                          onChange={(opt) => {
                            const newArr = [...gad7];
                            newArr[i] = opt;
                            setGad7(newArr);
                          }}
                          index={i}
                          questionType="gad7"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Functional Impairment</h3>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
                        </span>
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="select select-bordered w-full"
                      >
                        {DIFFICULTY_OPTIONS.map((d, i) => (
                          <option key={i} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="card-actions justify-center">
                    <button
                      onClick={handleFormDetect}
                      disabled={loading}
                      className={`btn btn-accent btn-lg ${loading && activeMethod === 'form' ? 'loading' : ''}`}
                    >
                      {loading && activeMethod === 'form' ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <FileText className="w-5 h-5 mr-2" />
                      )}
                      Submit Assessment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Results Section */}
        {(result || loading) && !showHistory && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">Results</h3>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mr-3" />
                  <span className="text-lg">Analyzing emotion...</span>
                </div>
              )}

              {result && !result.error && !result.daily_summary && (
                <div className="space-y-4">
                  <div className="alert alert-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>Analysis completed successfully!</span>
                  </div>
                  
                  <div className="stats stats-vertical lg:stats-horizontal shadow">
                    {result.phq9_total !== undefined && (
                      <div className="stat">
                        <div className="stat-title">PHQ-9 Score</div>
                        <div className="stat-value text-primary">{result.phq9_total}</div>
                        <div className="stat-desc">{getSeverityBadge(result.phq9_total, 27, 'phq9')}</div>
                      </div>
                    )}
                    {result.gad7_total !== undefined && (
                      <div className="stat">
                        <div className="stat-title">GAD-7 Score</div>
                        <div className="stat-value text-secondary">{result.gad7_total}</div>
                        <div className="stat-desc">{getSeverityBadge(result.gad7_total, 21, 'gad7')}</div>
                      </div>
                    )}
                    {result.difficulty && (
                      <div className="stat">
                        <div className="stat-title">Difficulty Level</div>
                        <div className="stat-value text-accent text-sm">{result.difficulty}</div>
                      </div>
                    )}
                  </div>

                  {result.interpretation && (
                    <div className="bg-base-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Clinical Interpretation:</h4>
                      <p className="text-base-content/80">{result.interpretation}</p>
                    </div>
                  )}
                </div>
              )}

              {result && result.error && (
                <div className="alert alert-error">
                  <AlertCircle className="w-5 h-5" />
                  <span>{result.error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back Button for History View */}
        {showHistory && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => {
                setShowHistory(false);
                setResult(null);
              }}
              className="btn btn-primary btn-circle btn-lg shadow-lg"
              title="Back to Detection"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionDetectPage;