import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaPaperPlane, FaRobot } from "react-icons/fa";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi there! I'm Groot, your movie assistant. Ask me anything about movies, bookings, or CineVibe!",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem("userId");

      // Call backend API
      const response = await axios.post("http://localhost:3000/api/groot/chat", {
        message: input,
        userId
      });

      // Add bot response to chat
      if (response.data && response.data.response) {
        setMessages((prev) => [
          ...prev,
          { text: response.data.response, sender: "bot" },
        ]);
      } else if (response.data && response.data.error) {
        // Handle error response from backend
        setMessages((prev) => [
          ...prev,
          { text: response.data.error, sender: "bot" },
        ]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error getting response:", error);

      // Get error message from response if available
      let errorMessage = "As your CineVibe assistant, I'm here to help with movie information, bookings, and platform questions. It seems I'm having a connection issue at the moment. Please try again shortly.";

      // Check if the error is because of authentication
      if (error.response?.status === 401) {
        console.error("Authentication error with Groot API - check API key");
        errorMessage = "I'm having trouble connecting to my knowledge base. Please try again later while our team fixes this issue.";
      } else if (error.response?.data?.response) {
        errorMessage = error.response.data.response;
      } else if (error.message === "Network Error") {
        errorMessage = "Cannot connect to the server. Please make sure the backend server is running.";
      }

      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          sender: "bot"
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-pink-600 p-3 text-white flex items-center">
        <FaRobot className="mr-2 text-xl" />
        <h3 className="font-bold">Groot Assistant</h3>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-3 ${
              message.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg max-w-[80%] ${
                message.sender === "user"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-800 text-white"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-3">
            <div className="inline-block p-3 rounded-lg bg-gray-800 text-white">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-gray-800 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 p-2 rounded-l-md bg-gray-700 text-white focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-pink-600 text-white p-2 rounded-r-md hover:bg-pink-700 transition-colors"
          disabled={isLoading}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
