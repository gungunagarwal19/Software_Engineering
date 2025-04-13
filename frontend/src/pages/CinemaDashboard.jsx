import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaChair } from "react-icons/fa";

const SeatDisplay = ({ bookedSeats }) => {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const seatsPerRow = 16;

    const isSeatBooked = (seatId) => {
        return bookedSeats.includes(seatId);
    };

    return (
        <div className="flex flex-col items-center p-5 bg-gray-800 rounded-lg shadow-xl">
            <div className="bg-gray-700 text-white w-3/5 text-center p-2 rounded-md font-bold mb-5 text-sm">
                Stage
            </div>

            <div className="flex flex-col items-center gap-4">
                {rows.map((row) => (
                    <div key={row} className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-3 justify-center">
                        {Array(seatsPerRow)
                            .fill()
                            .map((_, seatIndex) => {
                                const seatId = `${row}${seatIndex + 1}`;
                                const isBooked = isSeatBooked(seatId);
                                return (
                                    <div
                                        key={seatId}
                                        className={`w-12 h-12 flex items-center justify-center rounded-md text-xs cursor-default
                                            ${isBooked ? "bg-gray-600 opacity-60" : "bg-gray-400 text-black"}`}
                                        title={`Seat ${seatId} - ${isBooked ? "Booked" : "Available"}`}
                                    >
                                        <FaChair className="text-xl" />
                                    </div>
                                );
                            })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CinemaDashboard = () => {
    const [theaterName, setTheaterName] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Extract all booked seats from tickets
    const bookedSeats = tickets.reduce((seats, ticket) => {
        const ticketSeats = JSON.parse(ticket.seats);
        return [...seats, ...ticketSeats];
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!theaterName.trim()) {
            setError('Please enter a theater name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`http://localhost:3000/tickets/theater/${encodeURIComponent(theaterName)}`);
            setTickets(response.data);
        } catch (error) {
            setError('Error fetching tickets. Please try again.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Cinema Owner Dashboard</h1>
                
                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={theaterName}
                            onChange={(e) => setTheaterName(e.target.value)}
                            placeholder="Enter theater name"
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Search Tickets
                        </button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center text-white">
                        Loading tickets...
                    </div>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Seat Display */}
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4">Seat Status</h2>
                        <SeatDisplay bookedSeats={bookedSeats} />
                    </div>

                    {/* Tickets List */}
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4">Booked Tickets</h2>
                        {tickets.length > 0 ? (
                            <div className="space-y-4">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                        <div className="grid grid-cols-2 gap-4 text-white">
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">{ticket.movie}</h3>
                                                <p><span className="text-gray-400">Theater:</span> {ticket.theater}</p>
                                                <p><span className="text-gray-400">Date:</span> {new Date(ticket.date).toLocaleDateString()}</p>
                                                <p><span className="text-gray-400">Time:</span> {ticket.time}</p>
                                            </div>
                                            <div>
                                                <p><span className="text-gray-400">Seats:</span> {JSON.parse(ticket.seats).join(', ')}</p>
                                                <p><span className="text-gray-400">Price:</span> ₹{ticket.price}</p>
                                                <p><span className="text-gray-400">Booked by:</span> {ticket.user_name}</p>
                                                <p><span className="text-gray-400">Email:</span> {ticket.user_email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-sm text-gray-400">
                                            Booked on: {new Date(ticket.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !loading && theaterName && (
                            <div className="text-center text-white">
                                No tickets found for this theater.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CinemaDashboard;
