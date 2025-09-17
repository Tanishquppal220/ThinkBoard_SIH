import { useEffect, useState, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { AppContent } from "../context/AppContext";

import "leaflet/dist/leaflet.css";
import api from "../lib/axios";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationPage = () => {
    const {backendUrl,updateMyLocation } = useContext(AppContent);
    const [users, setUsers] = useState([]);

    const fetchLocations = async () =>{
        try {
            const {data} = await api.get('/api/user/locations');
            if (data.success){
                setUsers(data.users);
            }
        
        } catch (error) {
            console.error("Error Fetching locations: ",error);
            
        }
    }

     useEffect(() => {
    updateMyLocation(); // update mine when entering page
    fetchLocations();   // fetch all

    const interval = setInterval(fetchLocations, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);



  return (
    <div className="w-full h-[calc(100vh-60px)]">
      <MapContainer
        center={[20, 78]} // default India center
        zoom={5}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {users.map((user) =>
          user.location?.lat && user.location?.lng ? (
            <Marker
              key={user._id}
              position={[user.location.lat, user.location.lng]}
            >
              <Popup>
                <div className="flex items-center gap-2">
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user.name}</span>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  )
}

export default LocationPage
