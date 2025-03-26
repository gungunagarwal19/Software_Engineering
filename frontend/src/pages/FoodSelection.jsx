import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const FoodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSeats = location.state?.selectedSeats || [];
  const seatPrices = location.state?.seatPrices || {}; // Contains ticket price for each seat

  const [seatFoodSelection, setSeatFoodSelection] = useState(
    selectedSeats.reduce((acc, seat) => ({ ...acc, [seat]: [] }), {})
  );
  const [totalPrice, setTotalPrice] = useState(
    selectedSeats.reduce((sum, seat) => sum + (seatPrices[seat] || 0), 0) // Initial ticket prices
  );
  const [currentSeat, setCurrentSeat] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const foodItems = [
    { id: 1, name: "Burger", price: 120 },
    { id: 2, name: "Pizza", price: 250 },
    { id: 3, name: "Fries", price: 70 },
    { id: 4, name: "Salad", price: 150 },
  ];

  // Recalculate total price when food selections change
  useEffect(() => {
    const foodTotal = Object.entries(seatFoodSelection).reduce((sum, [seat, foodIds]) => {
      const seatFoodTotal = foodIds.reduce((seatSum, id) => {
        const food = foodItems.find((item) => item.id === id);
        return seatSum + (food ? food.price : 0);
      }, 0);
      return sum + (seatPrices[seat] || 0) + seatFoodTotal; // Includes ticket price
    }, 0);

    setTotalPrice(foodTotal);
  }, [seatFoodSelection, seatPrices]);

  const toggleFoodSelection = (foodId) => {
    if (!currentSeat) return;
    setSeatFoodSelection((prev) => ({
      ...prev,
      [currentSeat]: prev[currentSeat].includes(foodId)
        ? prev[currentSeat].filter((id) => id !== foodId)
        : [...prev[currentSeat], foodId],
    }));
  };

  const handleCheckout = () => {
    navigate("/payment", { state: { totalPrice, seatFoodSelection } });
  };

  return (
    <div
      className="p-5 min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/food1.jpg')" }}
    >
      <h1 className="text-2xl font-bold text-center text-white mb-4">
        Selected Seats & Food Details
      </h1>

      {selectedSeats.map((seat) => {
  const selectedFood = seatFoodSelection[seat] || [];
  const foodTotal = selectedFood.reduce((sum, id) => {
    const food = foodItems.find((item) => item.id === id);
    return sum + (food ? food.price : 0);
  }, 0);

  const seatTotalPrice = (seatPrices[seat] || 0) + foodTotal; // Includes ticket price

  return (
    <div key={seat} className="flex flex-col justify-between bg-white p-4 mb-3 rounded-lg shadow-md">
      <div className="flex justify-between">
        <div>
          <span className="font-bold">Seat {seat} (₹{seatPrices[seat]})</span>
          <p className="text-sm text-gray-500">
            {selectedFood.length === 0 ? "No food selected" : "Food Selected:"}
          </p>
        </div>
        <button
          className="px-4 py-2 bg-purple-200 rounded-lg"
          onClick={() => {
            setCurrentSeat(seat);
            setShowModal(true);
          }}
        >
          Select Food
        </button>
      </div>

      {/* Display selected food items and their prices */}
      {selectedFood.length > 0 && (
        <ul className="mt-2 text-gray-700">
          {selectedFood.map((id) => {
            const food = foodItems.find((item) => item.id === id);
            return (
              <li key={id} className="flex justify-between">
                <span>{food.name}</span>
                <span>₹{food.price}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Seat total price */}
      <div className="text-right font-bold mt-2">Total: ₹{seatTotalPrice}</div>
    </div>
  );
})}


      <div className="text-center mt-5 text-lg font-bold text-white">
        Your total fare is ₹{totalPrice}
      </div>

      <button
        className="block mx-auto mt-4 px-6 py-3 bg-purple-500 text-white font-bold rounded-lg"
        onClick={handleCheckout}
      >
        Pay ₹{totalPrice}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Select Food for Seat {currentSeat}</h2>
            {foodItems.map((food) => (
              <label key={food.id} className="flex items-center justify-between mb-2">
                <div>
                  <p>{food.name}</p>
                  <p className="text-sm text-gray-500">₹{food.price}</p>
                </div>
                <input
                  type="checkbox"
                  checked={seatFoodSelection[currentSeat]?.includes(food.id)}
                  onChange={() => toggleFoodSelection(food.id)}
                />
              </label>
            ))}
            <div className="flex justify-between mt-4">
              <button className="text-red-500" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="bg-purple-500 text-white px-4 py-2 rounded-lg" onClick={() => setShowModal(false)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodSelection;
