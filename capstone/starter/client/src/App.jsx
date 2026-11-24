// TaskFlow Client Starter
import React, { useState, useEffect } from 'react';

export function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO (Milestone 6): Fetch tasks from /api/tasks
    setLoading(false);
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>TaskFlow Board</h1>
      {loading ? <p>Loading tasks...</p> : <p>0 tasks loaded. Add your first task!</p>}
    </main>
  );
}

export default App;
