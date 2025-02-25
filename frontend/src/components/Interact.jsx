import React, { useState, useEffect } from 'react'
import '../stylesheets/interact.css'
import { Button, Dialog } from "@mui/material";
import { io } from "socket.io-client";
import axios from 'axios';
import PreventRefresh from './PreventRefresh';

const Interact = () => {
  let alert_sfx = new Audio("assets/alert.mp3")
  
  const [played, setPlayed] = useState(true)


  const [filter, setFilter] = useState(false)

  const [viewData, setViewData] = useState()
  const [socketAlert, setSocketAlert] = useState([])
  const [alertDialog, setAlertDialog] = useState(false)

  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);
  const [open5, setOpen5] = useState(false);

  const [rtsp, setRtsp] = useState("")

  const [name, setName] = useState("")
  const [idNum, setIdNum] = useState("")
  const [crime, setCrime] = useState("")
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  
  useEffect(() => {
    const socket = io("https://supreme-space-enigma-q7j9wg76rjvf4j6j-5000.app.github.dev/", {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000
    });
    

    socket.on("face_detected", (data) => {
      setSocketAlert((prevMsgs) => [data, ...prevMsgs]);
      setAlertDialog(true);
if (played === false){
        alert_sfx.play();
      }
      let count = 0;
      const interval = setInterval(() => {
        if (count < 9) {
          setFilter((prev) => !prev);
        } else {
          setFilter(false); 
          clearInterval(interval);
        }
        count += 1;
      }, 500);
    });

    return () => {
      socket.disconnect();
    };
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageUrl(URL.createObjectURL(file))

      setImage(file);
    }
  };



  const rtsp_submit_handler = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/rtsp_data", {
        rtsp
      });

      console.log("RTSP Setup Successful:", response.data);
    } catch (error) {
      console.error("Error in RTSP Setup:", error);
    }
  };


  const criminal_submit_handler = async (e) => {
    e.preventDefault();

    if (!name || !image) {
      alert("Please provide all details!");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);
    formData.append("idNum", idNum);
    if (crime === "") {
      formData.append("crime", "Missing Person");
    }
    else {
      formData.append("crime", crime);
    }
    try {
      const response = await axios.post("/image_data",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Success: " + response.data.message);
      setName("")
      setCrime("")
      setImage(null)
      setImageUrl(null)
      setIdNum("")
      setOpen2(false)
      setOpen3(false)

    } catch (error) {
      console.error("Error adding criminal:", error);
      alert("Error uploading image!");
    }
  };

  const retrive_view = async () => {
    try {

      const response = await axios.get("/all_data")
      setViewData(response.data)
      console.log(viewData);
    } catch (error) {
      console.log(error);

    }

  }

  const delete_record_handler = async (objectId) => {
    try {

      const response = await axios.post("/delete_document", { objectId })
      if (response.status === 200) {
        retrive_view()
      }
    } catch (error) {
      console.log(error);

    }

  }


  return (
    <Dialog open={true} className='prevent_refresh'>
      <PreventRefresh />
      <Dialog className="alert_filter" open={filter}></Dialog>
      <div className='top_nav'>
        <img src="assets/logo.png" alt="logo"/>
        <Button>Logout</Button>
      </div>
      <div className="side_bar">
        <div onClick={() => setOpen(true)}>
          Connect/Change RTSP
        </div>
        <div onClick={() => setOpen2(true)}>
          Add Criminal Record
        </div>
        <div onClick={() => setOpen3(true)}>
          Add Missing Person Record
        </div>
        <div onClick={() => setOpen4(true)}>
          Image Identifier
        </div>

        <div onClick={() => {
          setOpen5(true);
          retrive_view();
        }}>
          View & Remove Records
        </div>

        <div onClick={() => {
          setAlertDialog(true)
          setFilter(false)
        }}>
          View Alerts
        </div>
      </div>

      <div className="frame">
        <h1>RTSP Footage</h1>
        {/* <img
          src="/video_feed"
          alt="RTSP Stream"
        /> */}
      </div>

      <Dialog transitionDuration={0} open={played} onClose={() => setPlayed(false)} className="custom-dialog">
        <div className="dialog-container">
<h1 className='played_alert'><center>We'd like to play alert sounds for important notifications. Please grant permission.</center></h1>
            <Button onClick={()=>setPlayed(false)} variant="contained" className="connect-btn">Ok</Button>
        </div>
      </Dialog>


      {/*......... RTSP Connection .........*/}
      <Dialog transitionDuration={0} open={open} onClose={() => setOpen(false)} className="custom-dialog">
        <div className="dialog-container">
          <div className="form-header form-header1">
            <img onClick={() => setOpen(false)} src="assets/back.svg" alt="back" />
            <h1>Setup RTSP</h1>
          </div>

          <form onSubmit={rtsp_submit_handler} className="form-body">
            <input type="text" placeholder="Enter RTSP URL" onChange={(e) => setRtsp(e.target.value)} required />
            <Button type='submit' variant="contained" className="connect-btn">Connect</Button>
          </form>
        </div>
      </Dialog>

      {/*......... Adding Criminal Data .........*/}
      <Dialog transitionDuration={0} open={open2} onClose={() => setOpen2(false)} className="custom-dialog-2">

        <div className="form-header2 form-header">
          <img onClick={() => setOpen2(false)} src="assets/back.svg" alt="back" />
          <h1>Register a Criminal Profile</h1>
        </div>

        <form className="dialog-container-2" onSubmit={criminal_submit_handler}>
          <div className="image-upload-section">
            <img
              onClick={() => document.getElementById('file-upload').click()}
              src={imageUrl || "assets/logo.png"}
              alt="Criminal_Photo"
            />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              required
            />
          </div>
          <div className="form-body-2">

            <input type="text" placeholder="Enter Criminal's Name" onChange={(e) => setName(e.target.value)} required />

            <input type="text" placeholder="Enter Criminal's Crime" onChange={(e) => setCrime(e.target.value)} required />

            <input type="text" placeholder="Enter Criminal Identification Number" onChange={(e) => setIdNum(e.target.value)} required />

            <Button type='submit' className="add-record-btn">Add New Record</Button>

          </div>
        </form>
      </Dialog>

      {/*........ Adding Missing Person Data .........*/}
      <Dialog transitionDuration={0} open={open3} onClose={() => setOpen3(false)} className="custom-dialog-2">

        <div className="form-header2 form-header">
          <img onClick={() => setOpen3(false)} src="assets/back.svg" alt="back" />
          <h1>Register a Missing Person Profile</h1>
        </div>

        <form onSubmit={criminal_submit_handler} className="dialog-container-2">
          <div className="image-upload-section">
            <img
              onClick={() => document.getElementById('file-upload').click()}
              src={imageUrl || "assets/logo.png"}
              alt="Person_Photo"
            />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }} required
            />
          </div>
          <div className="form-body-2">
            <input type="text" placeholder="Enter Person's Name" onChange={(e) => setName(e.target.value)} required />

            <input type="text" placeholder="Enter Person Identification Number" onChange={(e) => setIdNum(e.target.value)} required />

            <Button type='submit' className="add-record-btn">Add New Record</Button>

          </div>
        </form>
      </Dialog>


      {/*........ Find Matches .........*/}
      <Dialog transitionDuration={0} open={open4} onClose={() => setOpen4(false)} className="custom-dialog-2"></Dialog>


      {/*........ Removeing Data Data .........*/}
      <Dialog transitionDuration={0} open={open5} onClose={() => setOpen5(false)} className="custom-dialog-2">
        <div className="form-header form-header1">
          <img onClick={() => setOpen5(false)} src="assets/back.svg" alt="back" />
          <h1>View And Delete The Record</h1>
        </div>
        <div className="dialog-container dialog-container5">


          <ol className="view">

            {viewData && viewData.length > 0 ? viewData.map((field) => (
              <li>
                <img src={field[1]} alt="Person" />
                <div>
                  <div>
                    <h3>{field[4]}</h3>
                    <h1>{field[3]}</h1>
                  </div>
                  <Button onClick={() => delete_record_handler(field[0])}>Remove</Button>
                </div>
              </li>
            )) : <p>loding...</p>}


          </ol>

        </div>
      </Dialog>


      <Dialog transitionDuration={0} open={alertDialog} onClose={() => setAlertDialog(false)} className="custom-dialog-2">
        <div className="form-header form-header1">
          <img onClick={() => setAlertDialog(false)} src="assets/back.svg" alt="back" />
          <h1>Alerts</h1>
        </div>
        <div className="dialog-container dialog-container5">


          <ol className="alert">


            {socketAlert.length > 0 ? (
              socketAlert.map((alert, index) => (
                <li key={index} className="alert_container">
                  <div>
                    <div className='alert_details2'><h2><center>Stored Image</center></h2>
                      <h2><center>Matched Image</center></h2></div>
                    <div>
                      <img src={alert.url} alt="i" />
                      <img src={URL.createObjectURL(new Blob([new Uint8Array(alert.image_bytes)], { type: 'image/jpeg' }))} alt="alert_image" />

                    </div>
                    <div className='alert_details'><h2><center>{alert.Name}</center></h2>
                      <h2><center>{alert.Crime}</center></h2></div>


                    <div className='alert_details'><h2><center>{alert.Similarity} Similarity</center></h2></div>
                  </div>

                </li>
              ))
            ) : (
              <li className='blank_alert'><h1>No alerts yet.</h1></li>
            )}

          </ol>

        </div>
      </Dialog>

    </Dialog>
  )
}

export default Interact
