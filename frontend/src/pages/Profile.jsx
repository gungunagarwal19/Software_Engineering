import { useState, useEffect } from "react";
import axios from "axios";
import Chatbot from "../components/Chatbot";

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
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [generatingTicketId, setGeneratingTicketId] = useState(null);

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

  // Function to generate QR code for a ticket
  const generateQrCode = async (ticket) => {
    try {
      setIsGeneratingQR(true);
      setGeneratingTicketId(ticket.id);

      // We don't need to parse seats here as the backend will handle it

      // Call the backend endpoint to generate a QR code
      const response = await axios.get(`http://localhost:3000/ticket/${ticket.id}/qr`);

      if (response.data && response.data.qrCode) {
        // Update the ticket in the local state with the new QR code
        const updatedTickets = ticketHistory.map(t => {
          if (t.id === ticket.id) {
            return { ...t, qr_code: response.data.qrCode };
          }
          return t;
        });

        setTicketHistory(updatedTickets);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      setError("Failed to generate QR code");
    } finally {
      setIsGeneratingQR(false);
      setGeneratingTicketId(null);
    }
  };



  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        background: "linear-gradient(to right, #ff00cc, #000000)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Error message */}
        {error && (
          <div className="bg-red-900 text-white p-3 rounded-md mb-4 flex justify-between items-center">
            <p>{error}</p>
            <button onClick={() => setError('')} className="text-white hover:text-red-200">
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Profile and Tickets */}
          <div className="lg:w-1/2 space-y-6">
            {/* Profile Section */}
            <div className="p-6 rounded-xl shadow-lg bg-black">
              <h2 className="text-2xl font-bold mb-4 text-pink-400">Profile Information</h2>

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
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Ticket Info */}
                        <div className="flex-1">
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

                        {/* QR Code */}
                        {ticket.qr_code ? (
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="bg-white p-3 rounded-lg mb-2">
                              <img
                                src={`data:image/png;base64,${ticket.qr_code}`}
                                alt="Ticket QR Code"
                                className="h-[150px] w-[150px]"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `data:image/png;base64,${ticket.qr_code}`;
                                link.download = `ticket-${ticket.id}-qr.png`;
                                link.click();
                              }}
                              className="text-xs bg-pink-600 text-white px-2 py-1 rounded hover:bg-pink-700"
                            >
                              Download QR
                            </button>
                          </div>
                        ) : (
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="bg-gray-700 p-3 rounded-lg mb-2 flex items-center justify-center" style={{ width: '150px', height: '150px' }}>
                              <p className="text-xs text-center text-gray-400">QR Code<br/>Not Available</p>
                            </div>
                            <button
                              onClick={() => generateQrCode(ticket)}
                              className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                              disabled={isGeneratingQR && generatingTicketId === ticket.id}
                            >
                              {isGeneratingQR && generatingTicketId === ticket.id ? 'Generating...' : 'Generate QR'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Chatbot */}
          <div className="lg:w-1/2">
            <div className="p-6 rounded-xl shadow-lg bg-black">
              <h2 className="text-2xl font-bold mb-4 text-pink-400">Movie Assistant</h2>
              <p className="text-gray-400 mb-4">Ask Groot anything about movies, bookings, or CineVibe!</p>
              <Chatbot />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
