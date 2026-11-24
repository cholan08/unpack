import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'networks',
  title: 'CN',
  name: 'Computer Networks',
  tagline: 'How packets cross the world: OSI and TCP/IP, IP addressing and subnetting, routing, TCP vs UDP, DNS and network security.',
  color: 'purple',
  pillar: 'devops',
  order: 20,
  cover: {
    big: 'CN',
    full: 'Computer Networks',
    cloud: ['Packets', 'find their', 'way across', 'the world'],
    art: {
      topLeft: iconArt('server', 'CN', 'purple'),
      topRight: flowArt(['Application', 'Transport', 'Network', 'Link'], 'purple'),
      left: codeArt(['192.168.1.10/24', 'port 443 → HTTPS', 'TTL = 64'], 'Addresses'),
      centre: hubArt('Internet', ['Routers', 'Switches', 'DNS', 'Protocols'], 'cloud', 'purple'),
    },
    side: { title: 'Layers', items: ['HTTP', 'TCP / UDP', 'IP', 'Ethernet'] },
    why: { title: 'Why Networks ?', items: ['How the internet works', 'Debug real outages', 'Core placement subject', 'Needed for cloud and DevOps'] },
    footer: 'Every click is a journey!',
  },
  pages: [
    pg('introduction', 'Introduction to Computer Networks', 'What a network is', 'LAN, MAN, WAN', 'Topologies', 'Network devices'),
    pg('models', 'OSI & TCP/IP Models', 'The 7 OSI layers', 'The 4 TCP/IP layers', 'Encapsulation', 'Data unit names per layer'),
    pg('data-link', 'Physical & Data Link Layers', 'Transmission media', 'MAC addresses and framing', 'Error detection (CRC)', 'Switches and ARP'),
    pg('ip', 'Network Layer & IP Addressing', 'IPv4 addresses and classes', 'Subnetting and CIDR', 'IPv6', 'NAT'),
    pg('routing', 'Routing', 'Static vs dynamic routing', 'Distance vector vs link state', 'RIP, OSPF, BGP', 'Routing tables'),
    pg('transport', 'Transport Layer: TCP & UDP', 'Ports and sockets', 'The TCP three-way handshake', 'Flow and congestion control', 'TCP vs UDP'),
    pg('application', 'Application Layer', 'HTTP and HTTPS', 'How DNS resolves a name', 'Email: SMTP, POP3, IMAP', 'FTP and DHCP'),
    pg('security', 'Network Security', 'Firewalls', 'VPNs', 'TLS', 'Attacks: DDoS, MITM, spoofing'),
    pg('tools', 'Tools & Troubleshooting', 'ping and traceroute', 'nslookup / dig', 'netstat / ss', 'Wireshark'),
    revision('OSI vs TCP/IP', 'TCP vs UDP', 'Hub vs switch vs router'),
  ],
});
