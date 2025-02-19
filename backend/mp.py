import cv2
import torch
import numpy as np
import pymongo
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

# Flask app setup
app = Flask(__name__)
CORS(app)
# app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  

# socketio = SocketIO(app)
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=100 * 1024 * 1024)

@app.route('/health', methods=['GET'])
def health_check():
    return {"host": request.host}

# Load models
model = YOLO("yolov8n-face.pt")
facenet = InceptionResnetV1(pretrained='vggface2').eval()

# MongoDB setup
client = pymongo.MongoClient(os.getenv("MONGO_URI"))
db = client["face_recognition"]
collection = db["face_vectors"]

def normalize_vector(vector):
    return vector / np.linalg.norm(vector)

def store_face_vector(name, vector, idNum, crime):
    if not is_vector_stored(vector):
        collection.insert_one({"name": name, "idNum": idNum, "crime": crime, "face_vector": vector.tolist()})
        print(f"✅ Face vector stored for {name}")
        get_all_vectors()
        
def get_all_vectors():
    data = collection.find({}, {"face_vector": 1, "name": 1})
    return [(item["name"], np.array(item["face_vector"])) for item in data]

def is_vector_stored(new_vector):
    stored_vectors = get_all_vectors()
    for _, stored_vector in stored_vectors:
        if np.allclose(new_vector, stored_vector, atol=1e-5):
            return True
    return False

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

def process_faces(image, store=False, name = None, idNum = None, crime = None):
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
                    best_match, similarity = find_best_match(face_vector)
                    if best_match != "Unknown Person":
                        print(f"Best Match: {best_match}, Similarity: {similarity*100:.2f}%")
                        socketio.emit("face_detected", {"message": f"Face detected: {best_match}, Similarity: {similarity*100:.2f}%"})

@app.route('/image_data', methods = ["POST"])
def process_image_data():
    name = request.form.get('name')
    crime = request.form.get('crime')
    idNum = request.form.get('idNum')
    file = request.files.get('image')

    if not name:
        return jsonify({"error": "Name is required"}), 400

    if not file:
        return jsonify({"error": "No image provided"}), 400
    
    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
     
    process_faces(image, store=True, name=name, idNum=idNum, crime=crime)
    
    return jsonify({"message": f"Face processed and stored successfully for {name}"})

def rtsp_stream():
    cap = cv2.VideoCapture("Title_1.mp4") # http://192.0.0.4:3000

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            print("Error: Frame not captured")
            # cap.set(cv2.CAP_PROP_POS_FRAMES, 0) 
            # continue

            break

        process_faces(frame, store=False)

    cap.release()

if __name__ == '__main__':
    socketio.start_background_task(rtsp_stream)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
