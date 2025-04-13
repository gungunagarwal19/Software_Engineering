import { connectDb } from './lib/db.js';

async function checkColumnExists(pool, tableName, columnName) {
  try {
    // First check using INFORMATION_SCHEMA which is more reliable
    const [dbInfoResult] = await pool.execute('SELECT DATABASE() as dbName');
    const dbName = dbInfoResult[0].dbName;

    const [columns] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `, [dbName, tableName, columnName]);

    if (columns[0].count > 0) {
      return true;
    }

    // Fallback: try a direct query as a secondary check
    try {
      await pool.execute(`SELECT ${columnName} FROM ${tableName} LIMIT 1`);
      return true;
    } catch (queryError) {
      if (queryError.message.includes(`Unknown column '${columnName}'`)) {
        return false;
      }
      // If it's a different error, we'll assume the column might exist
      console.log(`Warning: Error checking column ${columnName} directly: ${queryError.message}`);
      return false;
    }
  } catch (error) {
    console.log(`Error in checkColumnExists for ${columnName}: ${error.message}`);
    // If there's an error in the INFORMATION_SCHEMA query, we'll be conservative and return false
    return false;
  }
}

async function addQrColumnsToTicketsTable() {
  try {
    console.log('Connecting to database...');
    const pool = await connectDb();

    console.log('Adding qr_code and qr_uuid columns to tickets table...');

    // Get database name from connection
    const [dbInfoResult] = await pool.execute('SELECT DATABASE() as dbName');
    const dbName = dbInfoResult[0].dbName;
    console.log(`Using database: ${dbName}`);

    // Check if columns already exist using INFORMATION_SCHEMA
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'tickets'
      AND COLUMN_NAME IN ('qr_code', 'qr_uuid')
    `, [dbName]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Existing columns from INFORMATION_SCHEMA:', existingColumns);

    // Double-check with direct query
    const qrCodeExists = await checkColumnExists(pool, 'tickets', 'qr_code');
    const qrUuidExists = await checkColumnExists(pool, 'tickets', 'qr_uuid');
    console.log(`Direct check - qr_code exists: ${qrCodeExists}, qr_uuid exists: ${qrUuidExists}`);

    // Add qr_code column if it doesn't exist based on direct check
    if (!qrCodeExists) {
      try {
        console.log('Adding qr_code column...');
        await pool.execute('ALTER TABLE tickets ADD COLUMN qr_code LONGTEXT NULL');
        console.log('qr_code column added successfully');
      } catch (columnError) {
        // If error is duplicate column, just log it and continue
        if (columnError.code === 'ER_DUP_FIELDNAME') {
          console.log('qr_code column already exists (detected during addition)');
        } else {
          throw columnError; // Re-throw if it's a different error
        }
      }
    } else {
      console.log('qr_code column already exists');
    }

    // Add qr_uuid column if it doesn't exist based on direct check
    if (!qrUuidExists) {
      try {
        console.log('Adding qr_uuid column...');
        await pool.execute('ALTER TABLE tickets ADD COLUMN qr_uuid VARCHAR(255) NULL');
        console.log('qr_uuid column added successfully');
      } catch (columnError) {
        // If error is duplicate column, just log it and continue
        if (columnError.code === 'ER_DUP_FIELDNAME') {
          console.log('qr_uuid column already exists (detected during addition)');
        } else {
          throw columnError; // Re-throw if it's a different error
        }
      }
    } else {
      console.log('qr_uuid column already exists');
    }

    console.log('Database update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

addQrColumnsToTicketsTable();
