@app.route('/image_identify', methods=["POST"])
def process_image_data_to_identify():
    file = request.files.get('image')

    if not file:
        return jsonify({"error": "Missing required fields"}), 400

    image = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    process_faces(image, store=False)













 
         _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])  
                 frame_bytes = buffer.tobytes()

                         yield (b'--frame\r\n'
                                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

                                        @app.route('/video_feed')
                                        def video_feed():
                                           return Response(rtsp_stream(),
                                              mimetype='multipart/x-mixed-replace; boundary=frame')
                                              















               
if __name__ == '__main__':
    socketio.start_background_task(rtsp_stream)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)