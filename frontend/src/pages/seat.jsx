import React, { useState, useEffect } from "react";
import { FaChair } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";

const SeatBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, theater } = location.state || {}; 
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const seatsPerRow = 16;
  const [bookedSeats, setBookedSeats] = useState([]);

  // Fetch already booked seats for this theater
  useEffect(() => {
    const fetchBookedSeats = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/tickets/theater/${encodeURIComponent(theater)}`);
        const allBookedSeats = response.data.reduce((seats, ticket) => {
          return [...seats, ...JSON.parse(ticket.seats)];
        }, []);
        setBookedSeats(allBookedSeats);
      } catch (error) {
        console.error("Error fetching booked seats:", error);
      }
    };

    if (theater) {
      fetchBookedSeats();
    }
  }, [theater]);

  const getSeatType = (rowIndex) => {
    if (rowIndex <= 1) return "gold";
    if (rowIndex >= 2 && rowIndex <= 6) return "diamond";
    if (rowIndex >= 7) return "recliner";
    return "gold";
  };
  
  const seatPrices = { gold: 100, diamond: 150, recliner: 200 };

  const [seats, setSeats] = useState(
    rows.flatMap((row, rowIndex) =>
      Array(seatsPerRow)
        .fill()
        .map((_, seatIndex) => ({
          id: `${row}${seatIndex + 1}`,
          type: getSeatType(rowIndex),
          booked: false,
          selected: false,
        }))
    )
  );

  const handleSeatClick = (id) => {
    setSeats(
      seats.map((seat) =>
        seat.id === id && !seat.booked
          ? { ...seat, selected: !seat.selected }
          : seat
      )
    );
  };

  const selectedSeats = seats.filter((seat) => seat.selected);
  const totalSeatPrice = selectedSeats.reduce((sum, seat) => sum + seatPrices[seat.type], 0);

  const handleBooking = async () => {
    const selectedSeatIds = selectedSeats.map(seat => seat.id);
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0];
    const formattedTime = currentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

    try {
      const responses = await Promise.all(
        selectedSeatIds.map(seatId =>
          fetch("http://localhost:3000/select-seat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seatId, theater }),
          }).then(res => res.json())
        )
      );

      setSeats(seats.map(seat =>
        responses.some(response => response.seatId === seat.id)
          ? { ...seat, booked: true, selected: false }
          : seat
      ));

      navigate("/food-selection", {
        state: {
          selectedSeats: selectedSeatIds,
          seatPrices: Object.fromEntries(
            selectedSeatIds.map(seatId => {
              const seat = seats.find(s => s.id === seatId);
              return [seatId, seatPrices[seat.type]];
            })
          ),
          movie,
          theater
        }
      });

    } catch (error) {
      console.error("Error booking seats:", error);
    }
  };

  const clearSelection = () => {
    setSeats(seats.map((seat) => ({ ...seat, selected: false })));
  };

  return (
    <div className="flex flex-col items-center p-5 bg-gray-900 min-h-screen font-sans text-white">
      <div className="bg-gray-700 text-white w-3/5 text-center p-2 rounded-md font-bold mb-5 text-sm">
        Stage
      </div>

      <div className="flex flex-col items-center gap-4">
        {rows.map((row) => (
          <div key={row} className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-3 justify-center">
            {seats
              .filter((seat) => seat.id.startsWith(row))
              .map((seat) => {
                const isBooked = bookedSeats.includes(seat.id);
                return (
                  <div
                    key={seat.id}
                    className={`w-12 h-12 flex items-center justify-center rounded-md text-xs cursor-pointer transition-transform duration-200
                      ${isBooked ? "bg-gray-600 opacity-60 cursor-not-allowed" : ""}
                      ${seat.selected ? "bg-orange-500 text-white" : ""} 
                      ${!seat.selected && !isBooked && seat.type === "gold" ? "bg-gray-400 text-black" : ""} 
                      ${!seat.selected && !isBooked && seat.type === "diamond" ? "bg-red-500 text-white" : ""} 
                      ${!seat.selected && !isBooked && seat.type === "recliner" ? "bg-blue-500 text-white rounded-lg" : ""}`}
                    onClick={() => !isBooked && handleSeatClick(seat.id)}
                    title={`Seat ${seat.id} - ${isBooked ? "Booked" : `₹${seatPrices[seat.type]}`}`}
                  >
                    <FaChair className="text-xl" />
                  </div>
                );
              })}
          </div>
        ))}

        <div className="flex gap-4 mt-5">
          <button
            className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600"
            onClick={handleBooking}
          >
            Book Selected
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-600"
            onClick={clearSelection}
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;