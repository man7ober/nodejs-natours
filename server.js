const mongoose = require('mongoose');

// Listening Uncaught Exception Before Loading Other Applications
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception 💥');
  process.exit(1);
});

// Listening Unhandled Rejection Before Loading Other Applications
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection 💥');
  console.log(err.name, err.message);
  process.exit(1);
});

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./index');

const db = process.env.DB.replace('<PASSWORD>', process.env.DB_PASS);

// Connect MongoDB Server
mongoose.connect(db).then(() => console.log(`MongoDB connected💚`));

// Start Node Server
const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Listening on ${port}💙`));
