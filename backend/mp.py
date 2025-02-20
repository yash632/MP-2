import cv2
import torch
import numpy as np
import pymongo
from flask import Flask, request, jsonify, Response
from flask_socketio import SocketIO
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv
from flask_cors import CORS
import threading

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=100 * 1024 * 1024)


model = YOLO("yolov8n-face.pt")
facenet = InceptionResnetV1(pretrained='vggface2').eval()

id = ""

client = pymongo.MongoClient(os.getenv("MONGO_URI"))
db = client["face_recognition"]
collection = db["face_vectors"]

def normalize_vector(vector):
    return vector / np.linalg.norm(vector)


def get_all_vectors():
    data = collection.find({}, {"face_vector": 1, "name": 1, "idNum": 1, "crime": 1})
    return [(str(item["_id"]), item["name"], np.array(item["face_vector"]), item["idNum"], item["crime"]) for item in data]


def find_best_match(input_vector, threshold=0.6):
    stored_vectors = get_all_vectors()
    if not stored_vectors:
        return "Unknown Person", None

    best_match, highest_similarity = None, -1
    for face_id, stored_vector in stored_vectors:
        sim = cosine_similarity(input_vector.reshape(1, -1), stored_vector.reshape(1, -1))[0][0]
        if sim > highest_similarity:
            highest_similarity, best_match = sim, face_id

    return (best_match, highest_similarity) if highest_similarity >= threshold else ("Unknown Person", highest_similarity)

def store_face_vector(name, vector, idNum, crime):
    collection.insert_one({"name": name, "idNum": idNum, "crime": crime, "face_vector": vector.tolist()})
    print(f"✅ Face vector stored for {name}")

def process_faces(image, store=False, name=None, idNum=None, crime=None):
    results = model.predict(image, verbose=False)
    for result in results:
        for box in result.boxes.xyxy:
            x1, y1, x2, y2 = map(int, box)
            face_crop = image[y1:y2, x1:x2]
            face_crop = cv2.resize(face_crop, (160, 160))
            face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
            face_tensor = torch.tensor(face_rgb).permute(2, 0, 1).unsqueeze(0).float() / 255.0

            with torch.no_grad():
                face_vector = facenet(face_tensor).numpy().flatten()
                face_vector = normalize_vector(face_vector)

                if store:
                    store_face_vector(name, face_vector, idNum, crime)
                else:
                    _id, best_match, similarity = find_best_match(face_vector)
                    if best_match != "Unknown Person" and id != _id:
                        id = _id
                        socketio.emit("face_detected", {"message": f"Face detected: {best_match}, Similarity: {similarity*100:.2f}%"})


def process_faces_threaded(image, store=False, name=None, idNum=None, crime=None):
    thread = threading.Thread(target=process_faces, args=(image, store, name, idNum, crime))
    thread.daemon = True
    thread.start()

@app.route('/image_data', methods=["POST"])
def process_image_data():
    name = request.form.get('name')
    crime = request.form.get('crime')
    idNum = request.form.get('idNum')
    file = request.files.get('image')

    if not name or not file:
        return jsonify({"error": "Missing required fields"}), 400

    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    process_faces_threaded(image, store=True, name=name, idNum=idNum, crime=crime)

    return jsonify({"message": f"Face processed and stored successfully for {name}"})

@app.route('/image_identify', methods=["POST"])
def process_image_data_to_identify():
    file = request.files.get('image')

    if not file:
        return jsonify({"error": "Missing required fields"}), 400

    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    process_faces_threaded(image, store=False)



def rtsp_stream():
    cap = cv2.VideoCapture("Title_3.mp4") 

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            print("Error: Frame not captured")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        process_faces_threaded(frame, store=False) 
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])  
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(rtsp_stream(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/all_data')
def view_remove():
    return get_all_vectors()

if __name__ == '__main__':
    socketio.start_background_task(rtsp_stream)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True )
