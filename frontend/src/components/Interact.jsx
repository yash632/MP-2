import React, {useState} from 'react'
import '../stylesheets/interact.css'
import { Button, Dialog } from "@mui/material";
 
const Interact = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
    <div className='top_nav'>
      <img src="assets/logo.png" alt="" />
      <Button>Logout</Button>
    </div>
    <div className="side_bar">
      <div onClick={()=>setOpen(true)}>
        Connect/Change RTSP
      </div>
      <div>
        Add Criminal Record
      </div>
      <div>
        Add Missing Person Record
      </div>
    </div>

    <div className="frame">

    </div>

    <Dialog open={open} onClose={() => setOpen(false)}></Dialog>

    </>
  )
}

export default Interact
