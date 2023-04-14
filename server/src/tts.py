from TTS.api import TTS
from fastapi import FastAPI
from pydantic import BaseModel

class TextPayload(BaseModel):
    text: str

app = FastAPI()
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", gpu=False)

@app.post("/create_sound")
def create_sound(payload: TextPayload):
    try:
        tts.tts_to_file(payload.text, file_path="./python-tts.wav")
        return {"status": "OK"}
    except:
        return {"status": "Error"}
