import React from "react";
import { useLocation } from "react-router-dom";
import { FaTicketAlt } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

const Ticket = ({ movie, theater, seats, date, time, price }) => {
  console.log("Fetched Movie",movie);
  const ticketData = `Movie: ${movie} | Theater: ${theater} | Seats: ${seats.join(", ")} | Date: ${date} | Time: ${time}`;
  console.log(ticketData);

  const downloadTicket = () => {
    const canvas = document.querySelector("canvas");
    const image = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
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
          <p className="text-gray-300">
            <strong>Theater:</strong> {theater}
          </p>
          <p className="text-gray-300">
            <strong>Seats:</strong> {seats.join(", ")}
          </p>
          <p className="text-gray-300">
            <strong>Date:</strong> {date}
          </p>
          <p className="text-gray-300">
            <strong>Time:</strong> {time}
          </p>
          <p className="text-gray-300">
            <strong>Price:</strong> ₹{price}
          </p>
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

const TicketPage = () => {
  const location = useLocation();
  const { movie, theater, selectedSeats, totalAmount, date, time } = location.state || {};
  console.log("Received data in TicketPage:", movie); 
  const movieTitle = typeof movie === "object" ? movie.title : movie;
  console.log("Processed Movie Title:", movieTitle);

  return (
    <Ticket
      movie={movieTitle || "Unknown Movie"}
      theater={theater || "Unknown Theater"}
      seats={selectedSeats || ["Unknown"]}
      date={date || new Date().toISOString().split("T")[0]} // Fallback to today's date
      time={time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })} // Fallback to current time
      price={totalAmount || "0"}
    />
  );
};

export default TicketPage;
