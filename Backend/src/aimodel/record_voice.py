import sounddevice as sd
from scipy.io.wavfile import write

# Settings
fs = 16000       # Sample rate (16 kHz is good for speech)
seconds = 5      # Duration of recording
filename = "test.wav"

print("🎤 Recording... Speak now!")
recording = sd.rec(int(seconds * fs), samplerate=fs, channels=1, dtype='int16')
sd.wait()  # Wait until recording is finished

# Save to file
write(filename, fs, recording)
print(f"✅ Recording saved as {filename}")
