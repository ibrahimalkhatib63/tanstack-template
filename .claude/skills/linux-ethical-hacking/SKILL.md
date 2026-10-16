---
name: linux-ethical-hacking
description: Reference skill summarizing Linux architecture and the ethical-hacking / penetration-testing methodology (reconnaissance, scanning, exploitation, post-exploitation, reporting), core Linux commands, Kali tooling, password-cracking (hashcat) basics, CTF practice platforms, and the legal boundaries of authorized security testing. Use when the user asks about Linux internals, pentest methodology, common security tools, or wants a learning roadmap for ethical hacking / CTF. Educational reference only — it never targets a specific system; any real engagement requires separate written authorization.
---

# Linux & Ethical Hacking — Reference Summary

This skill is a **study/reference guide**, not an attack tool. It does not contain
or produce scans, IPs, or results for any specific target. Any real-world use of
the techniques below requires explicit written authorization from the system
owner (a signed pentest/bug-bounty scope, or a system you personally own/control).
Unauthorized access to systems is illegal in essentially every jurisdiction
(e.g., UAE Federal Law No. 5 of 2012, US CFAA, etc.) and this skill must not be
used to plan or execute activity against a target without that authorization.

## 1. Linux Architecture

Layers from hardware up to applications:

| Layer | Role |
|---|---|
| Hardware (Ring 0) | CPU, RAM, disk, NIC |
| Kernel (Ring 0) | Memory, process, filesystem, network management |
| System calls | Bridge between programs and kernel (`read()`, `write()`, `fork()`) |
| Libraries (glibc) | Shared functions programs use (`malloc()`, `printf()`) |
| Shell (bash/zsh) | Command interface |
| User space (Ring 3) | User applications (browsers, security tools, etc.) |

## 2. Core Linux Commands

**Navigation**
- `ls -la`, `cd /path`, `pwd`, `find / -name file.txt`, `cat file.txt`

**Networking**
- `ip a` / `ifconfig`, `ping host`, `nmap -sV host`, `netstat -tlnp`, `curl -I https://host`

**Permissions**
- `chmod 755 file`, `chown user:group file`, `sudo command`, `sudo -l`, `find / -perm -4000` (SUID discovery)

## 3. Penetration-Testing Methodology

1. **Reconnaissance** — passive info gathering: `whois`, `dig`, `nslookup`, theHarvester, Shodan.
2. **Scanning** — active enumeration: `nmap`, `nikto`, `dirb`/`gobuster`, `enum4linux`.
3. **Exploitation** — only within written scope: Metasploit, `sqlmap`, `hydra`.
4. **Post-exploitation** — privilege escalation: `linpeas`, `sudo -l`, SUID binary hunting.
5. **Reporting** — document findings professionally (Dradis, Faraday, PDF/Word report).

Example reconnaissance commands (run only against assets you are authorized to test):
```
whois <target-domain>
dig <target-domain> ANY
nslookup <target-domain> 8.8.8.8
curl -I https://<target-domain>
openssl s_client -connect <target-domain>:443 2>/dev/null | head -20
nmap -sV <target-domain>
```

## 4. Password Cracking (Hashcat) — CTF & Authorized Tests Only

| Hash type | Hashcat mode |
|---|---|
| MD5 | `-m 0` |
| SHA1 | `-m 100` |
| SHA256 | `-m 1400` |
| bcrypt | `-m 3200` |
| NTLM | `-m 1000` |
| PostgreSQL | `-m 11` |

```
hashcat -m 0 -a 0 hash.txt /usr/share/wordlists/rockyou.txt
hashcat -m 0 -a 3 hash.txt ?d?d?d?d?d?d
hashcat -m 0 -a 0 hash.txt rockyou.txt -r best64.rule
hashcat -m 0 hash.txt --show
```

## 5. CTF Practice Platforms

| Platform | Level |
|---|---|
| OverTheWire Bandit | Beginner |
| PicoCTF | Beginner |
| TryHackMe | Beginner → Intermediate |
| HackTheBox | Intermediate → Advanced |
| CTFtime | All levels |

Start: `ssh bandit0@bandit.labs.overthewire.org -p 2220` (password `bandit0`).

## 6. Core Kali Linux Toolset

| Tool | Purpose |
|---|---|
| nmap | Port/service scanning |
| Metasploit (`msfconsole`) | Exploitation framework |
| Wireshark / tcpdump | Traffic analysis |
| hashcat / john | Password cracking |
| sqlmap | SQL injection testing |
| Burp Suite | Web app testing |
| gobuster / dirb | Directory discovery |
| hydra | Brute force (authorized only) |
| linpeas / winpeas | Privilege-escalation enumeration |

## 7. Legal Boundaries

| Allowed | Forbidden / criminal |
|---|---|
| Your own devices | Others' devices without permission |
| Local lab VMs | Public networks without authorization |
| Targets with written permission | Data theft |
| Official CTF challenges | Eavesdropping on others' networks |
| Bug bounty programs (in-scope) | Using hacking tools with malicious intent |

Always get explicit written authorization (scope letter, bug-bounty program rules,
or ownership) before running any scanning/exploitation tool against a target.

## 8. Learning Roadmap

| Phase | Content | Duration |
|---|---|---|
| 1. Fundamentals | Linux commands + TCP/IP + HTTP | Month 1 |
| 2. TryHackMe | Pre-Security + Jr Pentester paths | Months 2–3 |
| 3. eJPT certification | First practical cert | Month 3 |
| 4. HackTheBox | Real machines, Starting Point | Months 4–5 |
| 5. CEH / OSCP | Recognized professional certs | Month 6+ |
| 6. Bug bounty | HackerOne / Bugcrowd — paid work | After OSCP |

---
*For educational purposes only. Use strictly within authorized engagements, your own lab, or official CTF platforms.*
