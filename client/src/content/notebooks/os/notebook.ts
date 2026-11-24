import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'os',
  title: 'OS',
  name: 'Operating Systems',
  tagline: 'The core CS subject: processes and threads, CPU scheduling, synchronization, deadlocks, memory, virtual memory and file systems.',
  color: 'green',
  pillar: 'devops',
  order: 15,
  cover: {
    big: 'OS',
    full: 'Operating Systems',
    cloud: ['Share the', 'CPU, memory', 'and disks', 'fairly'],
    art: {
      topLeft: iconArt('pc', 'OS', 'green'),
      topRight: flowArt(['Apps', 'System calls', 'Kernel', 'Hardware'], 'green'),
      left: codeArt(['new → ready', '  → running', '  → waiting', '  → terminated'], 'Process states'),
      centre: hubArt('OS', ['Processes', 'Memory', 'Files', 'Devices'], 'pc', 'green'),
    },
    side: { title: 'Manages', items: ['CPU', 'Memory', 'Storage', 'I/O'] },
    why: { title: 'Why OS ?', items: ['A core CS subject', 'Asked in placement interviews', 'Explains performance', 'The base for Linux and Docker'] },
    footer: 'The OS is the manager of managers!',
  },
  pages: [
    pg('introduction', 'Introduction to Operating Systems', 'What an OS does', 'Types of OS', 'Kernel vs user mode', 'System calls'),
    pg('processes', 'Processes & Threads', 'Process vs program', 'PCB and process states', 'Threads and multithreading', 'Context switching'),
    pg('scheduling', 'CPU Scheduling', 'FCFS, SJF, SRTF', 'Priority and Round Robin', 'Gantt charts and waiting time', 'Multilevel queues'),
    pg('synchronization', 'Process Synchronization', 'Race conditions and the critical section', 'Mutex and semaphores', 'Producer–consumer', 'Dining philosophers'),
    pg('deadlocks', 'Deadlocks', 'The four necessary conditions', 'Resource allocation graph', 'Banker’s algorithm', 'Prevention, avoidance, recovery'),
    pg('memory', 'Memory Management', 'Contiguous allocation', 'Fragmentation', 'Paging and page tables', 'Segmentation'),
    pg('virtual-memory', 'Virtual Memory', 'Demand paging and page faults', 'Page replacement: FIFO, LRU, Optimal', 'Thrashing', 'The TLB'),
    pg('file-systems', 'File Systems', 'Files and directories', 'Allocation: contiguous, linked, indexed', 'Free-space management', 'Inodes'),
    pg('disk-io', 'Disk & I/O Management', 'Disk scheduling: FCFS, SSTF, SCAN, C-SCAN', 'RAID levels', 'Interrupts and DMA', 'Buffering and spooling'),
    revision('Process vs thread', 'Paging vs segmentation', 'Mutex vs semaphore', 'Deadlock vs starvation'),
  ],
});
