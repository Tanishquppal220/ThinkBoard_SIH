import axios from 'axios';
import userModel from '../models/userModel.js';
import FormData from "form-data";
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import moment from 'moment';
import _ from 'lodash';



export const detectEmotionCamera= async(req,res)=>{
    try {
        const { userId } = req.body;
        const response = await axios.post(process.env.PYTHON_API + '/detect-emotion/camera',{user_id : userId});
        console.log(response.data);

        const data = response.data;
        await userModel.findByIdAndUpdate(userId, {$push: {emotionHistory: data.history[data.history.length-1]}
        });

        res.json(data);
    } catch (err) {
        console.error("Camera detection error:", err.response?.data || err.message);
  res.status(500).json({
    error: err.message,
    details: err.response?.data, // show Python error
  });
        
    }
};

const upload = multer({ dest: "uploads/"});
export const detectEmotionVoice = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const userId = req.body.userId || req.body.user_id;


    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", fs.createReadStream(req.file.path));

    console.log("FormData fields:", formData.getHeaders());


    // Get headers including Content-Length
    const headers = formData.getHeaders();
    const contentLength = await new Promise((resolve, reject) => {
      formData.getLength((err, length) => {
        if (err) reject(err);
        else resolve(length);
      });
    });
    headers["Content-Length"] = contentLength;

    console.log("Sending to Python API:", {
  url: process.env.PYTHON_API + "/detect-emotion/voice",
  userId,
  filePath: req.file.path
});


    const response = await axios.post(
      process.env.PYTHON_API + "/detect-emotion/voice",
      formData,
      { headers }
    );

    const data = response.data;

    // Save last emotion in Mongo
    if (data?.history?.length > 0) {
      await userModel.findByIdAndUpdate(userId, {
        $push: { emotionHistory: data.history[data.history.length - 1] },
      });
    }

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json(data);
  } catch (err) {
    console.error("Voice detection error:", err.response?.data || err.message);
    res.status(500).json({ error: "Voice detection failed" });
  }
};

export const detectEmotionForm = async (req, res) => {
  try {
    const { user_id, phq9, gad7 } = req.body;

    if (!Array.isArray(phq9) || !Array.isArray(gad7)) {
      return res.status(400).json({ error: "phq9 and gad7 must be arrays of numbers" });
    }

    const response = await axios.post(process.env.PYTHON_API + "/detect-emotion/form", {
      user_id: user_id,
      phq9,
      gad7
    });

    const data = response.data;

    // Save last form result in Mongo
    if (data?.history?.length > 0) {
      await userModel.findByIdAndUpdate(user_id, {
        $push: { emotionHistory: data.history[data.history.length - 1] },
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Form detection error:", err.response?.data || err.message);
    res.status(500).json({ error: "Form detection failed" });
  }
};



export const getEmotionHistory = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await userModel.findById(userId);
    const history = user?.emotionHistory || [];

    if (history.length === 0) {
      return res.json({
        user_id: userId,
        message: "No emotion data available."
      });
    }

    const cutoff = moment().subtract(30, 'days');
    const recentHistory = history.filter(entry =>
      moment(entry.timestamp).isAfter(cutoff)
    );

    if (recentHistory.length === 0) {
      return res.json({
        user_id: userId,
        message: "No emotion data available in the last 30 days."
      });
    }

    // --- DAILY SUMMARY ---
    const dailyGroups = _.groupBy(recentHistory, entry =>
      moment(entry.timestamp).format('YYYY-MM-DD')
    );
    const daily_summary = _.mapValues(dailyGroups, entries =>
      _.head(_.orderBy(_.countBy(entries, 'emotion'), null, 'desc'))
    );

    // --- WEEKLY SUMMARY ---
    const weeklyGroups = _.groupBy(recentHistory, entry =>
      `${moment(entry.timestamp).isoWeekYear()}-W${moment(entry.timestamp).isoWeek()}`
    );
    const weekly_summary = _.mapValues(weeklyGroups, entries =>
      _.head(_.orderBy(_.countBy(entries, 'emotion'), null, 'desc'))
    );

    // --- MONTHLY SUMMARY ---
    const monthlyGroups = _.groupBy(recentHistory, entry =>
      moment(entry.timestamp).format('YYYY-MM')
    );
    const monthly_summary = _.mapValues(monthlyGroups, entries =>
      _.head(_.orderBy(_.countBy(entries, 'emotion'), null, 'desc'))
    );

    // --- TOP EMOTIONS ---
    const emotionCounts = _.countBy(recentHistory, 'emotion');
    const top_emotions_last_30_days = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    res.json({
      user_id: userId,
      daily_summary,
      weekly_summary,
      monthly_summary,
      top_emotions_last_30_days,
      total_entries_analyzed: recentHistory.length
    });

  } catch (error) {
    console.error("Error generating emotion summary:", error.message);
    res.status(500).json({ error: "Failed to generate emotion summary" });
  }
};

