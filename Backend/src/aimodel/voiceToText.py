import speech_recognition as sr
def speech_to_text_from_file(file_path):
    r = sr.Recognizer()
    with sr.AudioFile(file_path) as source:
        audio = r.record(source)

    try:
        text = r.recognize_google(audio)
        return(text)
    except sr.UnknownValueError:
        return("error")
    except sr.RequestError as e:
        return("error")


