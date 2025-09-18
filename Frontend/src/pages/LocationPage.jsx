import { useEffect, useState, useContext, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { AppContent } from "../context/AppContext";
import { MessageCircle, Clock } from "lucide-react";
import { Link } from "react-router";
import "leaflet/dist/leaflet.css";
import api from "../lib/axios";
import { useSocketStore } from "../store/useSocketStore";
import Navbar from "../components/Navbar";


// Custom marker
const createCustomIcon = (profilePic, isOnline = false) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; width: 48px; height: 48px;">
        <div style="
          width: 48px; 
          height: 48px; 
          border-radius: 50%; 
          border: 3px solid ${isOnline ? "#00D4FF" : "#FFFC00"};
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
        ">
          <img 
            src="${profilePic}" 
            style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRkZDMDAiLz4KPHBhdGggZD0iTTEyIDEyQzEzLjEgMTIgMTQgMTIuOSAxNCAxNEMxNCAxNS4xIDEzLjEgMTYgMTIgMTZDMTAuOSAxNiAxMCAxNS4xIDEwIDE0QzEwIDEyLjkgMTAuOSAxMiAxMiAxMlpNMjEgMTZDMTkuOSAxNiAxOSAxNS4xIDE5IDE0QzE5IDEyLjkgMTkuOSAxMiAyMSAxMkMyMi4xIDEyIDIzIDEyLjkgMjMgMTRDMjMgMTUuMSAyMi4xIDE2IDIxIDE2Wk0xMiAyMC41QzEwIDIwLjUgOSAyMS41IDkgMjNWMjRIMTVWMjNDMTUgMjEuNSAxNCAyMC41IDEyIDIwLjVaTTIxIDIwLjVDMTkgMjAuNSAxOCAyMS41IDE4IDIzVjI0SDI0VjIzQzI0IDIxLjUgMjMgMjAuNSAyMSAyMC41WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'"
          />
        </div>
        ${isOnline ? '<div style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background: #00D4FF; border-radius: 50%; border: 2px solid white;"></div>' : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

delete L.Icon.Default.prototype._getIconUrl;

const LocationPage = () => {
  const { backendUrl, updateMyLocation } = useContext(AppContent);
  const [users, setUsers] = useState([]);
  const { onlineUsers } = useSocketStore(); // 👈 from socket store
  const mapRef = useRef();

  const fetchLocations = async () => {
    try {
      const { data } = await api.get(backendUrl + "/api/user/locations");
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error Fetching locations: ", error);
    }
  };

  useEffect(() => {
    updateMyLocation();
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Enrich users with online state
  const enrichedUsers = users.map((u) => ({
    ...u,
    isOnline: onlineUsers.includes(u._id),
  }));

  return (
    <div>
    <Navbar/>
    <div className="relative w-full h-[calc(100vh-60px)] bg-base-300 overflow-hidden">
      
      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={[20, 78]}
        zoom={5}
        className="w-full h-full"
        zoomControl={false}
        style={{ background: "#1f2937" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {enrichedUsers.map((user) =>
          user.location?.lat && user.location?.lng ? (
            <Marker
              key={user._id}
              position={[user.location.lat, user.location.lng]}
              icon={createCustomIcon(user.profilePic, user.isOnline)}
            >
              <Popup closeButton={false} className="custom-popup" offset={[0, -10]}>
                <div className="card bg-base-100 shadow-xl min-w-[250px]">
                  <div className="card-body p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          <img src={user.profilePic} alt={user.name} />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-base-content">{user.name}</h3>
                        <div className="flex items-center gap-1 text-sm">
                          {user.isOnline ? (
                            <>
                              <div className="badge badge-success badge-xs"></div>
                              <span className="text-success">Online now</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-base-content/60" />
                              <span className="text-base-content/60">Last seen recently</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="card-actions justify-center gap-2">
                      <Link to="/chat">
                        <button className="btn btn-primary btn-sm flex">
                          <MessageCircle className="w-4 h-4" />
                          Message
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>

      {/* Bottom Stats */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="card bg-base-100/90 backdrop-blur-md shadow-lg compact">
          <div className="card-body p-2">
            <div className="flex gap-4 text-xs">
              <div className="text-center">
                <div className="font-bold text-sm text-primary">{users.length}</div>
                <div className="text-base-content/60">Friends</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm text-success">
                  {enrichedUsers.filter((u) => u.isOnline).length}
                </div>
                <div className="text-base-content/60">Online</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm text-info">
                  {enrichedUsers.filter((u) => u.location?.lat && u.location?.lng).length}
                </div>
                <div className="text-base-content/60">Sharing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LocationPage;
