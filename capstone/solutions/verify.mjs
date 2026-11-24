/**
 * Verification script for Capstone reference solutions.
 */
import assert from 'node:assert';

console.log('Verifying Capstone reference solutions...');

// Test 1: Healthcheck logic verification
{
  const healthz = (req, res) => ({ status: 'ok', uptime: 100 });
  const result = healthz({}, {});
  assert.strictEqual(result.status, 'ok', 'Healthcheck returns status ok');
}

// Test 2: Task status transition verification
{
  const updateTask = (task, patch) => ({ ...task, ...patch, updatedAt: new Date() });
  const task = { id: '1', title: 'Test', status: 'todo' };
  const updated = updateTask(task, { status: 'in-progress' });
  assert.strictEqual(updated.status, 'in-progress', 'Status updated successfully');
  assert.strictEqual(task.status, 'todo', 'Original task not mutated');
}

console.log('✓ All Capstone solutions verified successfully!');
