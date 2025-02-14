import React, { useState } from "react";
import { FaChair } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SeatBooking = () => {
  const navigate = useNavigate();
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const seatsPerRow = 16;

  const getSeatType = (rowIndex) => {
    if (rowIndex <= 1) return "gold";
    if (rowIndex >= 2 && rowIndex <= 6) return "diamond";
    if (rowIndex >= 7) return "recliner";
    return "gold";
  };

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

  const handleBooking = () => {
    setSeats(seats.map((seat) => (seat.selected ? { ...seat, booked: true, selected: false } : seat)));

    // Navigate to Food Selection Page
    navigate("/food-selection");
  };

  const clearSelection = () => {
    setSeats(seats.map((seat) => ({ ...seat, selected: false })));
  };

  return (
    <div className="flex flex-col items-center p-5 bg-gray-900 min-h-screen font-sans text-white">
      {/* Stage */}
      <div className="bg-gray-700 text-white w-3/5 text-center p-2 rounded-md font-bold mb-5 text-sm">
        Stage
      </div>

      {/* Seats Layout */}
      <div className="flex flex-col items-center gap-4">
        {rows.map((row) => (
          <div
            key={row}
            className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-3 justify-center"
          >
            {seats
              .filter((seat) => seat.id.startsWith(row))
              .map((seat) => (
                <div
                  key={seat.id}
                  className={`w-12 h-12 flex items-center justify-center rounded-md text-xs cursor-pointer transition-transform duration-200
                    ${seat.booked ? "bg-gray-600 opacity-60 cursor-not-allowed" : ""}
                    ${seat.selected ? "bg-orange-500 text-white" : ""} 
                    ${!seat.selected && seat.type === "gold" ? "bg-gray-400 text-black" : ""} 
                    ${!seat.selected && seat.type === "diamond" ? "bg-red-500 text-white" : ""} 
                    ${!seat.selected && seat.type === "recliner" ? "bg-blue-500 text-white rounded-lg" : ""}`}
                  onClick={() => !seat.booked && handleSeatClick(seat.id)}
                  title={`Seat ${seat.id} - ${seat.type}`}
                >
                  <FaChair className="text-xl" />
                </div>
              ))}
          </div>
        ))}

        {/* Booking Buttons */}
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
