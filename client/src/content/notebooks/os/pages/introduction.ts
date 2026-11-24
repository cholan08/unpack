import { definePage, exam, p, pairs, row, sec, sketch, table, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      sec(
        'What is an Operating System ?',
        ul(
          'An **Operating System (OS)** is system software that __manages the hardware__ and gives programs a __convenient, safe__ way to use it.',
          'It is the __interface__ between the __user / apps__ and the __hardware__.',
          'It shares the CPU, memory, disks and devices __fairly__ between many programs.',
          'Examples: `Windows`, `Linux`, `macOS`, `Android`, `iOS`.',
        ),
        sketch({
          w: 300,
          h: 214,
          nodes: [
            { id: 'u', x: 150, y: 24, w: 230, h: 36, text: 'User', icon: 'user', bold: true },
            { id: 'a', x: 150, y: 80, w: 230, h: 36, text: 'Application programs', tone: 'yellow' },
            { id: 'o', x: 150, y: 136, w: 230, h: 40, text: 'Operating System', bold: true, size: 16, tone: 'blue' },
            { id: 'h', x: 150, y: 192, w: 230, h: 36, text: 'Hardware (CPU, RAM, disk)', icon: 'pc', tone: 'green' },
          ],
          edges: [
            { from: 'u', to: 'a', arrow: 'both' },
            { from: 'a', to: 'o', arrow: 'both' },
            { from: 'o', to: 'h', arrow: 'both' },
          ],
        }),
      ),
      sec(
        'Goals & Functions of an OS',
        p('Goals: __convenience__, __efficiency__, __reliability__ and __security__.'),
        pairs(
          ['Process management', 'create, schedule and end processes'],
          ['Memory management', 'hand out RAM and take it back'],
          ['File management', 'files, folders, permissions'],
          ['Device (I/O) management', 'drivers, buffering, spooling'],
          ['Security & protection', 'users, passwords, access control'],
          ['User interface', 'a CLI (shell) or a GUI'],
        ),
      ),
    ),
    row(
      sec(
        'Types of Operating Systems',
        table(
          ['Type', 'Idea', 'Example'],
          [
            ['Batch', 'similar jobs grouped and run one after another, no interaction', 'early mainframes'],
            ['Multiprogramming', 'several programs in memory; the CPU switches when one waits for I/O', 'the base of modern OS'],
            ['Time-sharing', 'CPU time sliced between programs: quick response for every user', 'Linux, Windows'],
            ['Multiprocessing', 'two or more CPUs share the work', 'servers, modern PCs'],
            ['Distributed', 'many networked machines appear as one system', 'server clusters'],
            ['Real-time (RTOS)', 'must respond within a __deadline__ (hard or soft)', 'airbags, flight control'],
            ['Mobile', 'touch, battery and sensors first', 'Android, iOS'],
          ],
        ),
      ),
      sec(
        'Kernel Mode, User Mode & System Calls',
        ul(
          '**User mode**: apps run with __limited__ rights and can’t touch hardware directly.',
          '**Kernel mode**: the OS runs with __full__ access to the hardware.',
          'A **system call** is how a program asks the kernel for a service; it switches __user → kernel mode__ and back.',
        ),
        sketch({
          w: 420,
          h: 116,
          nodes: [
            { id: 'um', shape: 'text', x: 54, y: 14, text: 'user mode', size: 13 },
            { id: 'km', shape: 'text', x: 214, y: 14, text: 'kernel mode', size: 13 },
            { id: 'app', x: 54, y: 66, w: 92, h: 44, text: 'App', bold: true, tone: 'yellow' },
            { id: 'k', x: 214, y: 66, w: 100, h: 44, text: 'Kernel', bold: true, tone: 'blue' },
            { id: 'hw', x: 366, y: 66, w: 96, h: 44, text: 'Hardware', bold: true, tone: 'green' },
          ],
          edges: [
            { from: 'app', to: 'k', label: 'read()', ly: -12 },
            { from: 'k', to: 'hw', label: 'driver', ly: -12 },
          ],
        }),
        pairs(
          ['Process', '`fork()`, `exec()`, `wait()`, `exit()`'],
          ['File', '`open()`, `read()`, `write()`, `close()`'],
          ['Device', '`ioctl()`, `read()`, `write()`'],
          ['Information', '`getpid()`, `time()`'],
          ['Communication', '`pipe()`, `shmget()`'],
        ),
      ),
    ),
    row(
      sec(
        'Types of Kernels',
        table(
          ['Feature', 'Monolithic', 'Microkernel'],
          [
            ['Inside the kernel', 'everything: drivers, file system, scheduler', 'only the basics: IPC, scheduling, memory'],
            ['Speed', 'fast (fewer switches)', 'slower (more message passing)'],
            ['Reliability', 'a driver bug can crash the system', 'services fail in isolation'],
            ['Example', 'Linux', 'MINIX, QNX'],
          ],
        ),
        p('**Hybrid** kernels mix both ideas: Windows (NT) and macOS (XNU).'),
      ),
      exam(
        'OS = __resource manager__ + interface between the user and the hardware.',
        'Main functions: process, memory, file and device management, plus security.',
        'Time-sharing = multitasking with time slices; real-time = hard deadlines.',
        'System calls are the only door from user mode into kernel mode.',
        'Linux is monolithic (with loadable modules); MINIX is a microkernel.',
      ),
      [1.1, 1],
    ),
  ],
  quote: 'The OS is the manager every program reports to.',
});
