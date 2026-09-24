import sys
import urllib.request
import speech_recognition as sr
from pydub import AudioSegment
import os

def transcrever_audio(audio_url):
    try:
        # Download e conversão silenciosa
        urllib.request.urlretrieve(audio_url, "temp.mp3")
        AudioSegment.from_mp3("temp.mp3").export("temp.wav", format="wav")

        recog = sr.Recognizer()
        with sr.AudioFile("temp.wav") as source:
            audio_data = recog.record(source)
            # Retorna apenas o texto para o STDOUT (o que o Node vai ler)
            return recog.recognize_google(audio_data, language='en-US')
    except Exception:
        return "ERROR"
    finally:
        # Limpeza de ficheiros temporários
        for f in ["temp.mp3", "temp.wav"]:
            if os.path.exists(f): os.remove(f)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(transcrever_audio(sys.argv[1]))
