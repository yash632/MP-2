<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Image & Face Alerts</title>
    <script src="https://cdn.socket.io/4.0.1/socket.io.min.js"></script>
</head>
<body>
    <h2>Upload Image</h2>
    <form id="imageForm">
        <input type="text" name="name" id="name" placeholder="Enter Name" required>
        <input type="file" name="image" id="image" accept="image/*" required>
        <button type="submit">Submit</button>
    </form>

    <h2>Face Detection Alerts</h2>
    <div id="alerts"></div>

    <script>
        const socket = io("https://improved-halibut-r4p9pv9w4q4w3pr9v-5000.app.github.dev");

        document.getElementById("imageForm").addEventListener("submit", function(event) {
            event.preventDefault();

            let formData = new FormData(); 
            formData.append("name", document.getElementById("name").value);
            formData.append("image", document.getElementById("image").files[0]);

            fetch("https://improved-halibut-r4p9pv9w4q4w3pr9v-5000.app.github.dev/image_data", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => alert("Success: " + data.message))
            .catch(error => alert("Error: " + error));
        });

        // Socket.io event listener for face detection
        socket.on("face_detected", function(data) {
            let alertBox = document.getElementById("alerts");
            let newAlert = document.createElement("div");
            newAlert.innerHTML = `<p><strong>Alert:</strong> ${data.message}</p>`;
            newAlert.style.color = "blue";
            newAlert.style.fontWeight = "bold";
            alertBox.appendChild(newAlert);
        });
    </script>
</body>
</html>


























 
         _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])  
                 frame_bytes = buffer.tobytes()

                         yield (b'--frame\r\n'
                                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

                                        @app.route('/video_feed')
                                        def video_feed():
                                           return Response(rtsp_stream(),
                                              mimetype='multipart/x-mixed-replace; boundary=frame')
                                              