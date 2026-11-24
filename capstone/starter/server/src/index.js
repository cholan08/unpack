// TaskFlow Server Starter
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Health check endpoint (Milestone 2)
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// TODO (Milestone 4): Add /api/tasks routes

app.listen(PORT, () => {
  console.log(`TaskFlow server listening on http://localhost:${PORT}`);
});
