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
import cloudinary
import cloudinary.uploader

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=100 * 1024 * 1024)

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET") 
)

prev_id = ""
image_file = None
url = "Title_2.mp4"

model = YOLO("yolov8n-face.pt")
facenet = InceptionResnetV1(pretrained='vggface2').eval()


client = pymongo.MongoClient(os.getenv("MONGO_URI"))
db = client["face_recognition"]
collection = db["face_vectors"]

def normalize_vector(vector):
    return vector / np.linalg.norm(vector)

def get_all_vectors():
    data = collection.find({}, {"_id": 1, "url": 1, "public_id": 1, "name": 1, "crime": 1, "idNum": 1, "face_vector": 1})
    return [
        (
            str(item["_id"]),
            item["url"],
            item["public_id"],
            item["name"],                
            item.get("crime", ""),       
            item.get("idNum", ""),       
            np.array(item["face_vector"])
        )
        for item in data
    ]


def find_best_match(input_vector, threshold=0.65):
    stored_vectors = get_all_vectors()
    if not stored_vectors:
        return (None, "Unknown Person", "", "", None)
    
    best_id, best_name, best_crime, best_idNum = None, None, None, None
    highest_similarity = -1
    
    for _id, name, crime, idNum, stored_vector in stored_vectors:
        sim = cosine_similarity(input_vector.reshape(1, -1), stored_vector.reshape(1, -1))[0][0]
        if sim > highest_similarity:
            highest_similarity = sim
            best_id = _id
            best_name = name
            best_crime = crime
            best_idNum = idNum

    if highest_similarity >= threshold:
        return (best_id, best_name, best_crime, best_idNum, highest_similarity)
    else:
        return (best_id, "Unknown Person", "", "", highest_similarity)

def store_face_vector(name, vector, idNum, crime):
    global image_file
    image_file.seek(0)
    result = cloudinary.uploader.upload(image_file)
        
    collection.insert_one({"url": result.get("url"),"public_id": result.get("public_id"), "name": name, "idNum": idNum, "crime": crime, "face_vector": vector.tolist()})
    print(f"✅ Face vector stored for {name}")

def process_faces(image, store=False, name=None, idNum=None, crime=None):
    global prev_id 
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
                    _id, url, best_match, crime, idNum, similarity = find_best_match(face_vector)
                    if best_match != "Unknown Person" and prev_id != _id:
                        prev_id = _id
                        print("face_detected", {"message": f"Face detected: {best_match}, Similarity: {similarity*100:.2f}%"})
                        _, buffer = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 50])  
                        image_bytes = buffer.tobytes()

                        socketio.emit("face_detected", {
                            "url": url,
                            "image_bytes": image_bytes,
                            "Name": best_match,
                            "Identification Number": idNum,
                            "Crime": crime,
                            "Similarity": f"{similarity*100:.2f}%"
})

@app.route('/image_data', methods=["POST"])
def process_image_data():
    name = request.form.get('name')
    crime = request.form.get('crime')
    idNum = request.form.get('idNum')
    file = request.files.get('image')

    if not name or not file:
        return jsonify({"error": "Missing required fields"}), 400
    
    global image_file
    image_file = file
    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    process_faces(image, store=True, name=name, idNum=idNum, crime=crime)

    return jsonify({"message": f"Face processed and stored successfully for {name}"})

@app.route('/image_identify', methods=["POST"])
def process_image_data_to_identify():
    file = request.files.get('image')

    if not file:
        return jsonify({"error": "Missing required fields"}), 400

    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    process_faces(image, store=False)


@app.route('/rtsp_data', methods=["POST"])
def rtsp_link_handler():
    data = request.get_json() 
    global url
    url = data.get("rtsp")  
    print("Received RTSP:", url)
    
    return jsonify({"status": "success", "message": "RTSP Setup Successful"})

def rtsp_stream():
    global url
    current_url = url  
    cap = cv2.VideoCapture(current_url)
    
    while True:
        if current_url != url:
            print("URL updated, switching stream...")
            current_url = url
            cap.release()
            cap = cv2.VideoCapture(current_url)

        ret, frame = cap.read()
        if not ret or frame is None:
            print("Error: Frame not captured")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
           # break

        process_faces(frame, store=False)

@app.route('/all_data')
def view_remove():
    data = get_all_vectors() 
    subset = [(item[0], item[1], item[2], item[3], item[4]) for item in data]
    return jsonify(subset)


@app.route('/delete_document', methods=['POST'])
def delete_document():
    try:
        data = request.get_json()
        object_id = data.get('objectId')
        
        if not object_id:
            return jsonify({"error": "Object ID is required"}), 400
        
        from bson import ObjectId
        if not ObjectId.is_valid(object_id):
            return jsonify({"error": "Invalid Object ID"}), 400
        
        document = collection.find_one({"_id": ObjectId(object_id)})
        
        if not document:
            return jsonify({"error": "Document not found"}), 404
        
        public_id = document.get('public_id')  
        
        if public_id:
            cloudinary.uploader.destroy(public_id)  
        
        result = collection.delete_one({"_id": ObjectId(object_id)})

        if result.deleted_count == 1:
            return jsonify({"message": "Document and image deleted successfully"}), 200
        else:
            return jsonify({"error": "Document not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    socketio.start_background_task(rtsp_stream)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True )
