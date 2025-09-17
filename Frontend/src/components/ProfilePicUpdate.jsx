import { useState } from "react";
import api from "../lib/axios";
 // your axios instance

export default function ProfilePicUpdate() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const handleUpload = async () => {
    try {
         if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("profilePic", file);

    const res = await api.put("/api/user/update-profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.success) {
      setImageUrl(res.data.user.profilePic); // Cloudinary URL
    }
    } catch (error) {
        console.error("Error uploading file:", error);
        
    }
   
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      {imageUrl ? (
        <img src={imageUrl} alt="Profile" width={150} style={{ borderRadius: "50%" }} />
      ) : (
        <p>No profile picture yet</p>
      )}
    </div>
  );
}
