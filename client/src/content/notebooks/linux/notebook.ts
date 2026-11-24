import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'linux',
  title: 'Linux',
  name: 'Linux OS',
  tagline: 'The terminal and the OS behind most servers: file system, commands, permissions, processes, networking and scripting.',
  color: 'yellow',
  pillar: 'devops',
  order: 10,
  cover: {
    big: 'LINUX',
    full: 'Linux Operating System',
    cloud: ['Everything', 'is a file;', 'the terminal', 'is power'],
    art: {
      topLeft: iconArt('pc', 'Linux', 'yellow'),
      topRight: flowArt(['User', 'Shell', 'Kernel', 'Hardware'], 'yellow'),
      left: codeArt(['$ ls -la', '$ cd /var/log', '$ grep -i error app.log', '$ sudo apt update'], 'Terminal'),
      centre: hubArt('Kernel', ['Processes', 'Memory', 'Files', 'Devices'], 'server', 'yellow'),
    },
    side: { title: 'Commands', items: ['ls', 'grep', 'chmod', 'ssh'] },
    why: { title: 'Why Linux ?', items: ['Runs most servers', 'Every DevOps tool needs it', 'Free and open source', 'Terminal speed'] },
    footer: 'man is your best friend!',
  },
  pages: [
    pg('introduction', 'Introduction to Linux', 'What Linux is (kernel + distro)', 'Popular distros', 'Kernel, shell, user space', 'Installing it, or WSL'),
    pg('filesystem', 'File System Hierarchy', '/, /home, /etc, /var, /usr, /tmp', 'Absolute vs relative paths', 'Everything is a file', 'Mounts'),
    pg('commands', 'Essential Commands', 'ls, cd, pwd, mkdir, cp, mv, rm', 'cat, less, head, tail', 'find and locate', 'man and --help'),
    pg('permissions', 'Users, Groups & Permissions', 'rwx and octal notation', 'chmod, chown, chgrp', 'sudo and root', 'umask'),
    pg('text-pipes', 'Text Processing & Pipes', 'grep, sed, awk', 'Pipes and redirection', 'sort, uniq, wc, cut', 'xargs'),
    pg('processes', 'Processes & Services', 'ps, top, htop', 'Signals and kill', 'Background jobs', 'systemd and systemctl'),
    pg('packages', 'Package Management', 'apt / dnf / pacman', 'Repositories', 'Installing from source', 'snap and flatpak'),
    pg('networking', 'Networking Commands', 'ip, ping, traceroute', 'curl and wget', 'ss / netstat', 'ssh and scp'),
    pg('shell-scripting', 'Shell Scripting', 'Variables and arguments', 'if, loops, functions', 'Exit codes', 'cron jobs'),
    pg('admin-security', 'Logs, Disks & Security', 'journalctl and /var/log', 'df, du, free', 'Firewalls (ufw)', 'SSH keys and hardening'),
    revision('Hard link vs soft link', 'Process vs daemon', 'su vs sudo'),
  ],
});
