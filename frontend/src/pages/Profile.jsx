import { useState } from "react";
import { FaCamera } from "react-icons/fa";

export default function Profile_pg() {
  const [profilePic, setProfilePic] = useState(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 bg-gradient-to-r from-blue-400 to-purple-500 min-h-screen text-white">
      <div className="p-6 shadow-lg rounded-xl bg-white text-gray-900 text-center">
        <div className="relative w-32 h-32 mx-auto">
          <img
            src={profilePic || "https://via.placeholder.com/96"}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover shadow-lg hover:opacity-80 transition"
          />
          <label htmlFor="upload" className="absolute bottom-2 right-2 bg-blue-500 p-2 rounded-full cursor-pointer shadow-md">
            <FaCamera className="text-white" />
          </label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="upload" />
        </div>
        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your Address" className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="p-6 shadow-lg rounded-xl bg-white text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Booking History</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Avengers: Endgame - 25th Feb 2025</li>
          <li>The Batman - 12th Jan 2025</li>
        </ul>
      </div>

      <div className="p-6 shadow-lg rounded-xl bg-white text-gray-900">
        <h2 className="text-xl font-semibold mb-4">FAQ</h2>
        <details className="mb-2 bg-gray-100 p-3 rounded-md">
          <summary className="cursor-pointer font-semibold">How do I book tickets?</summary>
          <p className="pl-4 text-gray-700">Select your movie, choose seats, and pay online.</p>
        </details>
        <details className="mb-2 bg-gray-100 p-3 rounded-md">
          <summary className="cursor-pointer font-semibold">Can I cancel my booking?</summary>
          <p className="pl-4 text-gray-700">Yes, you can cancel within 24 hours before showtime.</p>
        </details>
        <details className="bg-gray-100 p-3 rounded-md">
          <summary className="cursor-pointer font-semibold">What payment methods are available?</summary>
          <p className="pl-4 text-gray-700">We accept credit/debit cards, UPI, and PayPal.</p>
        </details>
      </div>
    </div>
  );
}