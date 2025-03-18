import { useNavigate, useLocation } from "react-router-dom";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const totalAmount = location.state?.totalPrice || 0;

  const handlePayment = () => {
    alert(`Payment Successful! Amount Paid: ₹${totalAmount}`);
    navigate("/ticket", { state: { totalAmount } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Payment Page</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <p className="text-lg mb-4">Total Amount: <span className="font-bold">₹{totalAmount}</span></p>
        
        <button
          className="px-6 py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-600"
          onClick={handlePayment}
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;