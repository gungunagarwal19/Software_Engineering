import { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import axios from "axios";

export default function Profile_pg() {
  const [userData, setUserData] = useState({
    id: "",
    Name: "",
    Email: "",
    role: "",
    created_at: ""
  });
  const [ticketHistory, setTicketHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        
        // Fetch user data
        const userResponse = await axios.get(`http://localhost:3000/auth/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(userResponse.data);

        // Fetch ticket history
        const ticketsResponse = await axios.get(`http://localhost:3000/auth/tickets/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTicketHistory(ticketsResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load profile data");
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3000/auth/user/${userData.id}`,
        { Name: userData.Name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    }
  };

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background: "linear-gradient(to right, #ff00cc, #000000)",
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Section */}
        <div className="p-6 rounded-xl shadow-lg bg-black">
          <h2 className="text-2xl font-bold mb-4 text-pink-400">Profile Information</h2>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-pink-300 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={userData.Name}
                  onChange={(e) => setUserData({ ...userData, Name: e.target.value })}
                  className="w-full p-2 rounded-md bg-gray-900 text-white border border-pink-600"
                />
              ) : (
                <p className="p-2 bg-gray-900 rounded-md">{userData.Name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-pink-300 mb-1">Email</label>
              <p className="p-2 bg-gray-900 rounded-md">{userData.Email}</p>
            </div>
            
            <div>
              <label className="block text-pink-300 mb-1">Role</label>
              <p className="p-2 bg-gray-900 rounded-md">{userData.role}</p>
            </div>

            <div>
              <label className="block text-pink-300 mb-1">Member Since</label>
              <p className="p-2 bg-gray-900 rounded-md">
                {new Date(userData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {isEditing ? (
              <button
                onClick={handleUpdateProfile}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Ticket History Section */}
        <div className="p-6 rounded-xl shadow-lg bg-black">
          <h2 className="text-2xl font-bold mb-4 text-pink-400">Ticket History</h2>
          
          {ticketHistory.length === 0 ? (
            <p className="text-gray-400">No tickets booked yet</p>
          ) : (
            <div className="space-y-4">
              {ticketHistory.map((ticket, index) => (
                <div key={index} className="p-4 bg-gray-900 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-pink-300">{ticket.movie_title || ticket.movie}</h3>
                      {ticket.movie_year && (
                        <p className="text-gray-400">Year: {ticket.movie_year}</p>
                      )}
                      <p className="text-gray-400">Theater: {ticket.theater}</p>
                      <p className="text-gray-400">Date: {new Date(ticket.date).toLocaleDateString()}</p>
                      <p className="text-gray-400">Time: {ticket.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-semibold">₹{ticket.price}</p>
                      <p className="text-gray-400">Seats: {JSON.parse(ticket.seats).join(", ")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
