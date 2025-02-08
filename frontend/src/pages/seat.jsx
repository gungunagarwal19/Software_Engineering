import React, { useState } from "react";

const SeatBooking = () => {
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
        }))
    )
  );

  const handleSeatClick = (id) => {
    setSeats(
      seats.map((seat) =>
        seat.id === id ? { ...seat, booked: !seat.booked } : seat
      )
    );
  };

  return (
    <div className="flex flex-col items-center p-5 bg-gray-100 font-sans">
      <div className="bg-gray-800 text-white w-3/5 text-center p-2 rounded-md font-bold mb-5 text-sm">Stage</div>
      <div className="flex flex-col items-center gap-2 max-w-xl">
        <div className="mb-2">
          <img src="enter.png" alt="Entrance" className="w-32 h-30 mt-3 mr-[1080px]" />
        </div>
        {rows.map((row) => (
          <div key={row} className="grid grid-cols-16 gap-4 justify-center">
            {seats
              .filter((seat) => seat.id.startsWith(row))
              .map((seat) => (
                <div
                  key={seat.id}
                  className={`w-11 h-11 flex items-center justify-center rounded-md text-xs cursor-pointer transition-transform duration-200
                              ${seat.booked ? 'bg-gray-500 cursor-not-allowed opacity-60' : ''}
                              ${seat.type === 'gold' ? 'bg-yellow-400 text-black' : ''}
                              ${seat.type === 'diamond' ? 'bg-red-500 text-white' : ''}
                              ${seat.type === 'recliner' ? 'bg-blue-500 text-white rounded-lg' : ''}`}
                  onClick={() => !seat.booked && handleSeatClick(seat.id)}
                  title={`Seat ${seat.id} - ${seat.type}`}
                >
                  {seat.id}
                </div>
              ))}
          </div>
        ))}
        <div className="mt-2">
          <img src="exit.png" alt="Exit" className="w-32 h-30 mb-24 ml-[1080px]" />
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;
