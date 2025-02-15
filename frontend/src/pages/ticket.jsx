import React from "react";
import { FaTicketAlt } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";

const Ticket = ({ movie, theater, seat, date, time, price }) => {
  const ticketData = `Movie: ${movie} | Seat: ${seat} | Date: ${date} | Time: ${time}`;

  const downloadTicket = () => {
    const canvas = document.querySelector("canvas");
    const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${movie}-ticket.png`;
    link.click();
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <FaTicketAlt className="text-yellow-400 text-2xl" />
          <h2 className="text-xl font-bold">{movie} - Ticket</h2>
        </div>

        <div className="border-b border-gray-600 pb-4 mb-4">
          <p className="text-gray-300"><strong>Theater:</strong> {theater}</p>
          <p className="text-gray-300"><strong>Seat:</strong> {seat}</p>
          <p className="text-gray-300"><strong>Date:</strong> {date}</p>
          <p className="text-gray-300"><strong>Time:</strong> {time}</p>
          <p className="text-gray-300"><strong>Price:</strong> ₹{price}</p>
        </div>

        <div className="flex justify-center mb-4 bg-white p-2 rounded-lg">
          <QRCodeCanvas value={ticketData} size={120} />
        </div>

        <button 
          onClick={downloadTicket} 
          className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-600 font-bold transition-all duration-300"
        >
          Download Ticket
        </button>
      </div>
    </div>
  );
};

// Example Usage
const TicketPage = () => {
  return (
    <Ticket 
      movie="Avengers: Endgame"
      theater="PVR Cinemas"
      seat="A12"
      date="2025-02-15"
      time="7:30 PM"
      price="250"
    />
  );
};

export default TicketPage;