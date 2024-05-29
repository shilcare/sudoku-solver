# cSpell:disable
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import uuid
import os
import cv2
from recognizer import recognize
import config

app = Flask(__name__)

# Load all environment variables starting with a specific prefix into the config
app.config.from_object(config)

CORS(
    app,
    resources={
        r"/*": {
            "origins": app.config["SUDOKU_CLIENT_APP_ORIGIN"],
        }
    },
)


def recognize_sudoku(session_id):
    image_path = f"uploads/{session_id}.png"
    if not os.path.exists(image_path):
        return f"event: error\ndata: File {image_path} not found\n\n"
    img = cv2.imread(image_path)
    return recognize(img, session_id)


@app.route("/process-status")
def process_status():
    session_id = request.args.get("sessionId")
    print(f"Processing image for session {session_id}")
    return Response(recognize_sudoku(session_id), mimetype="text/event-stream")


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected for uploading"}), 400

    session_id = str(uuid.uuid4())
    # save the image to the disk with session_id as the filename
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, f"{session_id}.png"))
    print(f"File {file.filename} saved as {session_id}.png")
    return jsonify({"sessionId": session_id, "status": "success"})


if __name__ == "__main__":
    app.run(debug=True, threaded=True)
