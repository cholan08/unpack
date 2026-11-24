import { createTutorServer } from './app.mjs';

const PORT = process.env.PORT || 3001;
const server = createTutorServer();

server.listen(PORT, () => {
  console.log(`Unpacked AI Tutor proxy running on http://localhost:${PORT}`);
});
