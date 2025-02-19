import React, { useState } from 'react'
import '../stylesheets/interact.css'
import { Button, Dialog } from "@mui/material";
import axios from 'axios';

const Interact = () => {
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
    if (crime === "") {
      setCrime("Missing Person");
    }

    if (!name || !image) {
      alert("Please provide all details!");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);
    formData.append("idNum", idNum);
    formData.append("crime", crime);
      
    try {
      const response = await axios.post("/image_data",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Success: " + response.data.message);
    } catch (error) {
      console.error("Error adding criminal:", error);
      alert("Error uploading image!");
    }
  };


return (
  <>
    <div className='top_nav'>
      <img src="assets/logo.png" alt="" />
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
      <div onClick={() => setOpen5(true)}>
        View & Remove Records
      </div>
    </div>

    <div className="frame">

    </div>

    <Dialog transitionDuration={0} open={open} onClose={() => setOpen(false)} className="custom-dialog">
      <div className="dialog-container">
        <div className="form-header form-header1">
          <img onClick={() => setOpen(false)} src="assets/back.svg" alt="back" />
          <h1>Setup RTSP</h1>
        </div>

        <form onSubmit={rtsp_submit_handler} className="form-body">
          <input type="text" placeholder="Enter RTSP URL" onChange={(e) => setRtsp(e.target.value)} />
          <Button type='submit' variant="contained" className="connect-btn">Connect</Button>
        </form>
      </div>
    </Dialog>

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

    <Dialog transitionDuration={0} open={open3} onClose={() => setOpen3(false)} className="custom-dialog-2">

      <div className="form-header2 form-header">
        <img onClick={() => setOpen3(false)} src="assets/back.svg" alt="back" />
        <h1>Register a Mission Person Profile</h1>
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

    <Dialog transitionDuration={0} open={open4} onClose={() => setOpen4(false)} className="custom-dialog-2"></Dialog>

    <Dialog transitionDuration={0} open={open5} onClose={() => setOpen5(false)} className="custom-dialog-2">

      <div className="form-header2 form-header">
        <img onClick={() => setOpen5(false)} src="assets/back.svg" alt="back" />
        <h1>Register a Mission Person Profile</h1>
      </div>
      <ol className='view'>

        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
        <li>
          <img src="assets/logo.png" alt="" /><h1>Person/Criminal Name </h1><Button>Remove</Button>
        </li>
      </ol>
    </Dialog>

  </>
)
}

export default Interact
