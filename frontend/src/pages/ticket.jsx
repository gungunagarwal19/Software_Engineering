import React from "react";
import axios from 'axios';

import { useState, useEffect } from "react";


import { useLocation } from "react-router-dom";
import { FaTicketAlt } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";


const Ticket = ({ movie, theater, seats, date, time, price }) => {
  const [ticketId, setTicketId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("Ticket Props:", { movie, theater, seats, date, time, price });

  // State to track if QR code has been downloaded
  const [qrDownloaded, setQrDownloaded] = useState(false);

  // Function to automatically download QR code
  const autoDownloadQR = React.useCallback(() => {
    if (qrCode && !qrDownloaded && !isLoading) {
      // Create a temporary canvas with white background
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 240;  // QR code size plus padding
      canvas.height = 240;

      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the QR code on white background
      const img = new Image();
      img.onload = () => {
        // Draw the QR code centered on the white background
        ctx.drawImage(img, 20, 20, 200, 200);

        // Convert to data URL and download
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${movie}-ticket-${ticketId || 'new'}-qr.png`;
        link.click();

        // Mark as downloaded
        setQrDownloaded(true);
      };
      img.src = `data:image/png;base64,${qrCode}`;
    }
  }, [qrCode, qrDownloaded, isLoading, movie, ticketId]);

  useEffect(() => {
    // Send ticket details to backend
    const saveTicketToDB = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId'); // Get user ID from localStorage
        const response = await axios.post("http://localhost:3000/ticketsdetail", {
          movie,
          theater,
          seats,
          date,
          time,
          price,
          user_id: userId // Add user ID to the request
        });

        // Set the ticket ID and QR code from the response
        if (response.data) {
          if (response.data.ticket && response.data.ticket.id) {
            setTicketId(response.data.ticket.id);
          }

          if (response.data.qrCode) {
            setQrCode(response.data.qrCode);
          } else if (response.data.ticket && response.data.ticket.id) {
            // If QR code is not in the response, fetch it separately
            await fetchQrCode(response.data.ticket.id);
          }
        }
      } catch (error) {
        console.error("Error saving ticket:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Function to fetch QR code for a ticket
    const fetchQrCode = async (id) => {
      try {
        const response = await axios.get(`http://localhost:3000/ticket/${id}/qr`);
        if (response.data && response.data.qrCode) {
          setQrCode(response.data.qrCode);
        }
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    };

    saveTicketToDB();
  }, [movie, theater, seats, date, time, price]);

  // Effect to download QR code when it becomes available
  useEffect(() => {
    autoDownloadQR();
  }, [autoDownloadQR]);










  const downloadTicket = () => {
    if (isLoading) return;

    // Create a temporary canvas with white background
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 240;  // QR code size plus padding
    canvas.height = 240;

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (qrCode) {
      // If we have a base64 QR code from the API
      const img = new Image();
      img.onload = () => {
        // Draw the QR code centered on the white background
        ctx.drawImage(img, 20, 20, 200, 200);

        // Convert to data URL and download
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${movie}-ticket-${ticketId || 'new'}-qr.png`;
        link.click();
      };
      img.src = `data:image/png;base64,${qrCode}`;
    } else {
      // If we're using the fallback QR code from the canvas
      const qrCanvas = document.querySelector(".flex.justify-center.mb-4.bg-white canvas");
      if (qrCanvas) {
        // Draw the QR code centered on the white background
        ctx.drawImage(qrCanvas, 20, 20, 200, 200);

        // Convert to data URL and download
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${movie}-ticket-${ticketId || 'new'}-qr.png`;
        link.click();
      } else {
        console.error("No QR code found to download");
      }
    }
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
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px] w-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : qrCode ? (
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="Ticket QR Code"
              className="h-[200px] w-[200px]"
            />
          ) : (
            <QRCodeCanvas
              value={`CINEVIBE-TICKET: ${movie} | ${theater} | ${date} | ${time} | ${seats.join(",")}`}
              size={200}
              level="H"
            />
          )}
        </div>

        <button
          onClick={downloadTicket}
          className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-600 font-bold transition-all duration-300"
        >
          Download QR Code
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
