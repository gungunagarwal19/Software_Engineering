import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

// Create a connection pool
let pool;

export const connectDb = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      console.log("✅ Connected to MySQL database (pool established)");
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      throw error;
    }
  }
  return pool;
};

// Test database connection on startup
(async () => {
  try {
    const db = await connectDb();
    const connection = await db.getConnection();
    console.log("✅ Database connection successful!");
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error("❌ Initial database connection test failed:", error.message);
  }
})();
