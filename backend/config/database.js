import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://mohatifjan_db_user:Db25051999@pos.owk6bss.mongodb.net/ajz_pos?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event listeners
    conn.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    conn.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    return conn;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
