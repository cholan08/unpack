import { code, definePage, exam, note, p, pairs, row, sec, sketch, sub, table, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      [
        sec(
          'What is a Transaction ?',
          ul(
            'A __transaction__ is a group of database operations that run as __one unit__ of work.',
            '__All or nothing__: either every step succeeds, or none of them does.',
            'Example: a bank transfer = debit A __and__ credit B.',
          ),
        ),
        sec(
          'Properties of Transactions (ACID)',
          table(
            ['Property', 'Meaning', 'Bank-transfer example'],
            [
              ['**A**tomicity', 'all steps or none', 'a debit without its credit never happens'],
              ['**C**onsistency', 'valid state → valid state', 'the total money stays the same'],
              ['**I**solation', 'transactions don’t see each other’s half-done work', 'two transfers on one account don’t mix'],
              ['**D**urability', 'once committed, it survives crashes', 'the transfer is still there after a power cut'],
            ],
          ),
        ),
      ],
      [
        sec(
          'Transaction States',
          sketch({
            w: 470,
            h: 214,
            nodes: [
              { id: 'a', shape: 'oval', x: 62, y: 56, w: 100, h: 46, text: 'Active', tone: 'green', bold: true },
              { id: 'p', shape: 'oval', x: 228, y: 56, w: 124, h: 54, text: 'Partially\nCommitted', tone: 'yellow', bold: true, size: 13 },
              { id: 'c', shape: 'oval', x: 400, y: 56, w: 112, h: 46, text: 'Committed', tone: 'purple', bold: true },
              { id: 'f', shape: 'oval', x: 62, y: 170, w: 100, h: 46, text: 'Failed', tone: 'pink', bold: true },
              { id: 'b', shape: 'oval', x: 228, y: 170, w: 108, h: 46, text: 'Aborted', tone: 'pink', bold: true },
              { id: 't', shape: 'oval', x: 400, y: 170, w: 120, h: 46, text: 'Terminated', tone: 'green', bold: true },
            ],
            edges: [
              { from: 'a', to: 'p', label: 'last step', ly: -12 },
              { from: 'p', to: 'c', label: 'commit', ly: -12 },
              { from: 'a', to: 'f', label: 'error', lx: 26 },
              { from: 'p', to: 'f', label: 'error', lx: 14, ly: -6 },
              { from: 'f', to: 'b', label: 'rollback', ly: 16 },
              { from: 'c', to: 't' },
              { from: 'b', to: 't' },
            ],
          }),
          pairs(
            ['Active', 'running its operations'],
            ['Partially committed', 'last step done, not saved yet'],
            ['Committed', 'changes saved for good'],
            ['Failed', 'an error stopped it'],
            ['Aborted', 'rolled back to the state before it'],
            ['Terminated', 'finished (after commit or abort)'],
          ),
        ),
      ],
    ),
    row(
      sec(
        'SQL Commands for Transactions',
        pairs(
          ['START TRANSACTION / BEGIN', 'starts a transaction'],
          ['COMMIT', 'saves all changes for good'],
          ['ROLLBACK', 'undoes changes since the start'],
          ['SAVEPOINT sp1', 'marks a point inside it'],
          ['ROLLBACK TO sp1', 'undoes back to that point'],
          ['RELEASE SAVEPOINT sp1', 'removes the savepoint'],
        ),
        code(
          `BEGIN;
           UPDATE Account SET Balance = Balance - 500
             WHERE AccNo = 1;
           UPDATE Account SET Balance = Balance + 500
             WHERE AccNo = 2;
           COMMIT;  -- or ROLLBACK if anything failed`,
          'Example: transfer ₹500',
        ),
      ),
      [
        sec(
          'Concurrency Control',
          ul(
            'Many transactions run __at the same time__ to keep the system fast.',
            '__Concurrency control__ stops them from corrupting each other’s data; it enforces __Isolation__.',
            'Goal: the result equals __some serial order__ (serializability).',
          ),
        ),
        sec(
          'Problems in Concurrent Execution',
          table(
            ['Problem', 'What goes wrong', 'Example'],
            [
              ['Lost update', 'one write overwrites another', 'T1 and T2 both add to a balance; T1’s change is lost'],
              ['Dirty read', 'reading __uncommitted__ data', 'T2 reads T1’s change, then T1 rolls back'],
              ['Non-repeatable read', 'same row read twice, different values', 'T2 updates and commits between T1’s two reads'],
              ['Phantom read', 'run a query again, __new rows__ appear', 'T2 inserts a row matching T1’s WHERE'],
            ],
          ),
        ),
      ],
      [1, 1.15],
    ),
    row(
      [
        sec(
          'Isolation Levels',
          table(
            ['Level', 'Dirty read', 'Non-repeatable', 'Phantom'],
            [
              ['Read Uncommitted', 'possible', 'possible', 'possible'],
              ['Read Committed', '✗', 'possible', 'possible'],
              ['Repeatable Read', '✗', '✗', 'possible'],
              ['Serializable', '✗', '✗', '✗'],
            ],
          ),
          p('✗ = prevented. A higher level is safer, but slower (more waiting).'),
        ),
        sec(
          'Techniques for Concurrency Control',
          table(
            ['Technique', 'Idea', 'Note'],
            [
              ['Locking', 'lock data before using it', 'most common; can deadlock'],
              ['Timestamp ordering', 'the older transaction goes first', 'no locks; may restart'],
              ['Optimistic (validation)', 'check for clashes at commit', 'good when clashes are rare'],
              ['MVCC', 'keep several versions of a row', 'readers never block writers (PostgreSQL, InnoDB)'],
            ],
          ),
        ),
      ],
      [
        sec(
          'Locking Protocol',
          pairs(['Shared lock (S)', 'for reading; many transactions can hold it'], ['Exclusive lock (X)', 'for writing; one holder only, blocks others']),
          sub(
            'Two-Phase Locking (2PL)',
            ul(
              '**Growing phase**: only __acquire__ locks.',
              '**Shrinking phase**: only __release__ locks.',
              'Guarantees __conflict-serializable__ schedules.',
              '**Strict 2PL**: hold X locks until commit, so no cascading rollbacks.',
            ),
          ),
          note(
            'Deadlock:',
            p('T1 waits for T2’s lock while T2 waits for T1’s. Fix: __detect__ it (wait-for graph) and abort one, or __prevent__ it with timeouts and a fixed lock order.'),
          ),
        ),
        exam(
          'Transactions follow __ACID__.',
          '`COMMIT` saves; `ROLLBACK` undoes.',
          'Problems: lost update, dirty read, non-repeatable read, phantom read.',
          'Isolation levels trade safety for speed.',
          '2PL = growing, then shrinking; it ensures serializability.',
          'Locking can deadlock: detect it or prevent it.',
        ),
      ],
    ),
  ],
  quote: 'All or nothing: that’s what makes a transaction safe.',
});
