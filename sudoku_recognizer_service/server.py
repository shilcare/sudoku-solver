# cSpell:disable
from flask import Flask, request, jsonify
import cv2
import numpy as np
from recognizer import recognize

app = Flask(__name__)


def recognize_sudoku(image):
    try:
        recognized_sudoku_puzzle = recognize(image)
    except Exception as e:
        print(e)
    return {"status": "success", "message": recognized_sudoku_puzzle}


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected for uploading"}), 400

    if file:
        # Convert the file storage to an OpenCV image
        npimg = np.fromstring(file.read(), np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Recognize the sudoku puzzle
        result = recognize_sudoku(img)

        return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
