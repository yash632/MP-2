import React, { useState } from 'react'
import '../stylesheets/interact.css'
import { Button, Dialog } from "@mui/material";

const Interact = () => {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);
  const [open5, setOpen5] = useState(false);

  const [image, setImage] = useState(null);

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);  // Set the image preview
      };
      reader.readAsDataURL(file);
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

          <form className="form-body">
            <input type="text" placeholder="Enter RTSP URL" />
            <Button variant="contained" className="connect-btn">Connect</Button>
          </form>
        </div>
      </Dialog>

      <Dialog transitionDuration={0} open={open2} onClose={() => setOpen2(false)} className="custom-dialog-2">

        <div className="form-header2 form-header">
          <img onClick={() => setOpen2(false)} src="assets/back.svg" alt="back" />
          <h1>Register a Criminal Profile</h1>
        </div>

        <div className="dialog-container-2">
          <div className="image-upload-section">
            <img
              onClick={() => document.getElementById('file-upload').click()}
              src={image || "assets/logo.png"}
              alt="Criminal_Photo"
            />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="form-body-2">
            <input type="text" placeholder="Enter Criminal's Name" />
            <input type="text" placeholder="Enter Criminal's Crime" />
            <input type="text" placeholder="Enter Criminal Identification Number" />
            <Button className="add-record-btn">Add New Record</Button>
          </div>
        </div>
      </Dialog>

      <Dialog transitionDuration={0} open={open3} onClose={() => setOpen3(false)} className="custom-dialog-2">

        <div className="form-header2 form-header">
          <img onClick={() => setOpen3(false)} src="assets/back.svg" alt="back" />
          <h1>Register a Mission Person Profile</h1>
        </div>

        <div className="dialog-container-2">
          <div className="image-upload-section">
            <img
              onClick={() => document.getElementById('file-upload').click()}
              src={image || "assets/logo.png"}
              alt="Criminal_Photo"
            />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="form-body-2">
            <input type="text" placeholder="Enter Person's Name" />
            <input type="text" placeholder="Enter Person Identification Number" />
            <Button className="add-record-btn">Add New Record</Button>
          </div>
        </div>
      </Dialog>

      <Dialog transitionDuration={0} open={open4} onClose={() => setOpen4(false)} className="custom-dialog-2"></Dialog>

      <Dialog transitionDuration={0} open={open5} onClose={() => setOpen5(false)} className="custom-dialog-2">

        <div className="form-header2 form-header">
          <img onClick={() => setOpen3(false)} src="assets/back.svg" alt="back" />
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
        </ol>
      </Dialog>

    </>
  )
}

export default Interact
