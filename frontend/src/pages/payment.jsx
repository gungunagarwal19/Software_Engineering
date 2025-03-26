import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const totalAmount = location.state?.totalPrice || 0;
  const [screenshot, setScreenshot] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setScreenshot(URL.createObjectURL(file));
    }
  };

  const handlePayment = () => {
    if (!screenshot) {
      alert("Please upload the payment screenshot before proceeding.");
      return;
    }
    alert(`Payment Successful! Amount Paid: ₹${totalAmount}`);
    navigate("/ticket", { 
      state: { 
        movie: "Avengers: Endgame", 
        theater: "PVR Cinemas", 
        selectedSeats: ["A12", "A13"], 
        totalAmount 
      } 
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Payment Page</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center w-full max-w-md">
        <p className="text-lg mb-4">Total Amount: <span className="font-bold">₹{totalAmount}</span></p>

        {/* Highlighted QR Code */}
        <div className="bg-white p-4 rounded-lg shadow-md border-4 border-yellow-400">
          <img src="/qr-code.jpg" alt="QR Code for Payment" className="w-52 h-52 mx-auto" />
        </div>
        <p className="text-sm text-yellow-300 font-bold mt-2">Scan the QR code above to make the payment</p>

        {/* Upload Payment Screenshot */}
        <div className="mt-4">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="upload" />
          <label htmlFor="upload" className="block bg-blue-500 text-white py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-600">Upload Payment Screenshot</label>
        </div>

        {screenshot && (
          <div className="mt-4">
            <p className="text-sm text-gray-400">Uploaded Screenshot:</p>
            <img src={screenshot} alt="Payment Screenshot" className="w-40 h-40 object-cover rounded-lg mt-2 border border-gray-500" />
          </div>
        )}

        <button
          className="mt-6 px-6 py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-600"
          onClick={handlePayment}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
