import cv2
import torch
import numpy as np
import pymongo
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv

load_dotenv()


model = YOLO("yolov8n-face.pt")
facenet = InceptionResnetV1(pretrained='vggface2').eval()

client = pymongo.MongoClient(os.getenv("MONGO_URI"))
db = client["face_recognition"]
collection = db["face_vectors"]

def normalize_vector(vector):
    return vector / np.linalg.norm(vector)

def store_face_vector(name, vector):
    if not is_vector_stored(vector):
        collection.insert_one({"name": name, "face_vector": vector.tolist()})
        print(f"✅ Face vector stored for {name}")

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

def process_faces(image, store=False):
    """Yeh function face detect karega, vector generate karega aur match check karega"""
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
                    store_face_vector("Are ye to BHALU h", face_vector)
                
                else:
                    best_match, similarity = find_best_match(face_vector)
                    if best_match != "Unknown Person":
                        print(f"Best Match: {best_match}, Similarity: {similarity*100:.2f}%")


is_image = False 

if is_image:
    image = cv2.imread("bhalu.jpg")
    process_faces(image, store=True)  # ✅ Sirf image ke case me store karega
else:
    cap = cv2.VideoCapture("Title.mp4")

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            print("Error: Frame not captured")
            exit() # continue
       
        process_faces(frame, store=False)

    cap.release()

cv2.destroyAllWindows()






