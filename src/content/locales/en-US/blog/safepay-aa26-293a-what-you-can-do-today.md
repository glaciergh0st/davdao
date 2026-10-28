```json
{
  "title": "SafePay Ransomware (AA26-293A), Part 1: What Can Be Done Today",
  "metaTitle": "SafePay Ransomware (AA26-293A), Part 1",
  "metaDescription": "The advisory hands defenders two things they can use today, a downloadable list of indicators and a set of named tools and behaviors.",
  "slug": "safepay-aa26-293a-what-you-can-do-today",
  "openGraphImagePrompt": "pipeline · 1 file, 4 tiers, 1 hunt",
  "tags": [
    "SafePay",
    "Ransomware",
    "Detection Engineering",
    "Threat Hunting",
    "Threat Intelligence"
  ],
"keyTakeaway": "CISA’s SafePay advisory provides immediate detection and response. Part 2 of this article series will cover contextual and behavioral detections that maintain coverage as indicators change.",
  "summary": "A practical guide to SafePay advisory AA26-293A: Prioritize which indicators to block, verify, or investigate, hunt historical logs, and deploy basic Sigma and YARA coverage while understanding what those layers miss.",
  "author": "David Awosusi",
  "category": "Detection Engineering",
  "publishedAt": "2026-10-27",
  "updatedAt": "2026-10-27",
  "visual": {
"title": "Review indicators before use",
"caption": "Assign each indicator to one of four action groups: block, verify, alert, or hunt.",
    "steps": [
      {
        "label": "Block",
        "detail": "The 12 file hashes: 6 SHA-256, 5 SHA-1 and 1 MD5"
      },
      {
        "label": "Verify",
        "detail": "The 6 addresses outside shared ranges"
      },
      {
        "label": "Alert",
        "detail": "The 3 addresses inside GitHub and Cloudflare ranges, and the 4 hostnames from the PDF"
      },
      {
        "label": "Hunt",
        "detail": "The file names from the PDF’s Table 3"
      }
    ]
  },
  "schema": {
    "title": "What the advisory provides",
    "caption": "The advisory links STIX downloads on pages 2 and 4.",
    "standards": [
      {
        "name": "File hashes",
        "fields": [
          {
            "name": "Count",
            "meaning": "4 SHA-1, 6 SHA-256"
          },
          {
            "name": "Where",
            "meaning": "Tables 4 and 5, pp. 10-11"
          },
          {
            "name": "Block outright?",
            "meaning": "Yes, with an exception for your red team"
          }
        ]
      },
      {
        "name": "IP addresses",
        "fields": [
          {
            "name": "Count",
            "meaning": "9"
          },
          {
            "name": "Where",
            "meaning": "Table 2, p. 8"
          },
          {
            "name": "Block outright?",
            "meaning": "No. The advisory says to verify first, and 3 of the 9 sit in GitHub or Cloudflare ranges"
          }
        ]
      }
    ],
    "output": {
      "name": "Where it loads",
      "fields": [
        "Endpoint prevention and the SIEM table",
        "Firewall and proxy in log-only mode, plus a SIEM alert",
        "SIEM alert only",
        "Search terms and rule seeds, never a deny list"
      ]
    }
  }
}
```

## Summary

SafePay enters with stolen or guessed credentials and through vulnerable internet-facing systems, moves with built-in admin tools, and destroys backups before it encrypts. [Advisory AA26-293A](https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf) (20 Oct 2026) ties it to at least 600 victims since August 2024, and takes its technical detail from FBI, Secret Service and German state police investigations through August 2026.

The advisory hands defenders two things they can use today, a downloadable list of indicators and a set of named tools and behaviors. Layer 1 loads those indicators into firewalls, proxies and the SIEM, then hunts back through old logs. Layer 2a alerts on basic behavioral indicators and isolated events, such as a shadow-copy wipe or an `rclone.exe` launch.

## What the advisory provides

The indicator tables list nine IP addresses, thirty file-name rows, ten file hashes and four hostnames, all observed between November 2024 and August 2026 (page 7). Only the hashes are safe to block outright.

| Indicator | Count | Where | What the advisory says | Block outright? |
| --- | --- | --- | --- | --- |
| File hashes | 4 SHA-1, 6 SHA-256 | Tables 4 and 5, pp. 10-11 | The ransomware binary, `locker.dll` and `soc.dll` builds, a RunPE bundled DLL, an injected PE, and two public tools (`SharpShares.exe` and NetExec) | Yes, with an exception for your red team |
| IP addresses | 9 | Table 2, p. 8 | Four "victim intrusion", two "used in exfiltration", and one each "hosting victim data", "client login panels" and "`soc.dll` command and control" | No. The advisory says to verify first, and 3 of the 9 sit in GitHub or Cloudflare ranges |
| File names | 30 rows | Table 3, pp. 8-10 | Attacker tools and their output files, plus legitimate software; the advisory itself calls 8 rows legitimate or benign | Never. Use for hunting and rule seeds |
| Hostnames | 4 | p. 11 | Four WIN- names with no context given | No. Alert only |

The advisory links STIX downloads on pages 2 and 4. The JSON is STIX 2.1 and the XML is STIX 1.2, and both hold the same 19 indicators: the nine addresses and the file hashes. File names and the four hostnames are only in the PDF.

In both files, the indicator for the SHA-256 that the tables label `SharpShares.exe` also holds a SHA-1, an MD5 and an SSDEEP fuzzy hash. The tables list none of the three, and the SHA-1 and MD5 bring the exact-match total to 12, against the tables' ten. The JSON also has 12 malware objects, mostly ordinary tools such as 7-Zip, WinRAR, AnyDesk and PowerShell, with no pattern to load.

Four things are in neither the tables nor the STIX file. There are no domain names or URLs: the Tor chat portal and leak site are described but not listed. No Mullvad addresses are listed either, although the text says the actors use that VPN provider for initial access. No command lines appear, only that the actors halted the Volume Shadow Copy service and reset NAS devices. And there is no YARA, Sigma or network signature content.

## Layer 1: Atomic ingestion and retroactive hunting

Focus. The indicators printed in the advisory: file hashes, IP addresses, file names and hostnames.

Execution. Download the STIX 2.1 JSON, sort every indicator by how safe it is to block, load each group into the control that suits it, then search old logs for earlier contact.

Goal. Block what is safe to block at once, alert on the rest, and find any hit from before the advisory came out. False positives stay low because the indicators are sorted before they are loaded, not because the indicators are perfect. The advisory itself tells you to verify its IP addresses before blocking them (page 7).

### Sort before you load

A STIX file is a bundle of indicators, and none of the 19 in CISA's file carries an indicator type, a confidence score or an expiry date. Nothing in it says which ones are safe to block; the advisory says that only in its notes, which ask you to verify addresses and tool use before acting. So the first step is a small program that reads the bundle and puts each indicator into one of four tiers.

| Tier | What goes in | Where it loads | Why |
| --- | --- | --- | --- |
| Block | The 12 file hashes: 6 SHA-256, 5 SHA-1 and 1 MD5 | Endpoint prevention and the SIEM table | A hash names one exact file. Keep an exception for your own red team, since `SharpShares.exe` and NetExec are public tools. |
| Verify | The 6 addresses outside shared ranges | Firewall and proxy in log-only mode, plus a SIEM alert | The advisory says to verify before blocking, and addresses get reassigned (page 19). Block one only after you have checked who owns it now. |
| Alert | The 3 addresses inside GitHub and Cloudflare ranges, and the 4 hostnames from the PDF | SIEM alert only | Blocking a shared address breaks real traffic, and a firewall cannot drop a Windows computer name. |
| Hunt | The file names from the PDF’s Table 3 | Search terms and rule seeds, never a deny list | By the advisory’s own notes, 8 of the 30 rows are legitimate software. |

Falcon's custom IOC types are SHA-256, MD5, domain and IP address, with no SHA-1 type ([CrowdStrike's custom IOC reference](https://developer.crowdstrike.com/cac/terraform/provider/endpoint-security/resources/custom-ioc/)). So the six SHA-256 values and the one MD5 can go in as endpoint blocks. The five SHA-1 values stay in the SIEM table and in file scans, such as the YARA rule in Layer 2a.

### The normalizer

Two small functions carry the logic. `classify` turns one STIX comparison into a kind and a clean value: it refangs [.] , lowercases hashes and keeps hostname case. `tier` applies the table above.

```python
# from stix_tiers.py
HASH_LEN = {"sha256": 64, "sha1": 40, "md5": 32}

def classify(obj, path, value):
    """One STIX comparison -> (kind, normalized value), or None if unsupported."""
    path = path.lower().replace("'", "").replace("-", "")
    value = value.replace("[.]", ".").strip()
    if obj in ("ipv4-addr", "ipv6-addr"):
        return "ip", value
    if obj == "domain-name":
        return ("domain", value.lower()) if "." in value else ("hostname", value)
    if obj == "url":
        return "url", value
    if obj == "file" and path.startswith("hashes."):
        algo = path.split(".", 1)[1]
        return (algo, value.lower()) if algo in HASH_LEN else None
    if obj == "file" and path == "name":
        return "filename", value
    return None

def tier(kind, value, shared):
    if kind in HASH_LEN:
        return "block"
    if kind == "ip":
        ip = ipaddress.ip_address(value)
        return "alert" if any(n.version == ip.version and ip in n for n in shared) else "verify"
    if kind in ("domain", "url"):
        return "verify"
    return "alert" if kind == "hostname" else "hunt"
```

The rest is plumbing that matters more than it looks. The script reads both STIX 2.0 and 2.1 patterns, skips private and malformed addresses, warns about comparisons it cannot use (the fuzzy hash in CISA's file is one) and writes its files atomically. If the feed parses to nothing, it exits without touching the old lists, so a broken download cannot empty a blocklist.

```text
$ python3 stix_tiers.py AA26-293A-stix.json out/ --shared-cidrs shared_ranges.txt
alert   ip        3
block   md5       1
block   sha1      5
block   sha256    6
verify ip         6
warning: indicator--8cf93b3c-54c6-4826-a77a-3b24358b1cab: unsupported comparison file:hashes.SSDEEP skipped
```

That run used CISA's own STIX 2.1 file. It holds no hostnames or file names, so the hunt `tier` is empty and the alert `tier` is just the three shared-range addresses. The four hostnames (page 11) go into Query 3 by hand, and the Layer 2a file-name rule takes its names from Table 3.

Table 3's 30 rows hold 32 explicit names and three wildcard patterns (`CCleaner*.exe` / `*.dll`, `Libwa*.dll` and `wa_3rd_party_host_*.exe`) that an exact-match list cannot hold. The Layer 2a file-name rule covers only the last.

### Three addresses you should not block

Before the verify `tier` means anything, check which of the nine addresses belong to large shared platforms. On 27 October 2026, three did. 140.82.114.4 falls inside GitHub's 140.82.112.0/20 , 185.199.108.133 inside GitHub's 185.199.108.0/22 , and 104.26.2.223 inside Cloudflare's 104.24.0.0/14 , as published on [GitHub's meta endpoint](https://api.github.com/meta) and [Cloudflare's IP list](https://www.cloudflare.com/ips/). Blocking any of them would cut off real GitHub and Cloudflare traffic for everyone behind your firewall. They go in the alert `tier`: a hit says something talked to a shared platform, and the useful question is which process made the call.

Both providers change their ranges, so the normalizer reads them from a file (`--shared-cidrs`) that you refresh on a schedule. Only these three matched a published range, so the other six stay in verify. Look up the current owner of each before moving any of them to a block list, and start with 88.119.167.239 , the only address the advisory ties to command and control (`soc.dll`).

### Hunt back through old logs

Loading indicators protects you from today onward. The same list should also be run backwards, in two passes.

- One-time backfill. Search as far back as your retention allows. The advisory's indicators were observed between November 2024 and August 2026, and a 30-day window run in late October 2026 starts in late September, so it does not overlap that period at all.

- Rolling 30-day recheck. Whenever the list changes, run the new indicators over the last 30 days. Logs arrive late, and indicators are often published after the activity they describe.

Say what your retention covers when you report a result. A clean 30-day search is not a clean search of the nearly two years the advisory spans.

Do not take a hunt window from the STIX file. Each indicator's `valid_from` is simply its creation date, and 15 of the 19 say 15 September 2026, while the advisory's activity window opens in November 2024.

The first two queries below read the lookup file `iocs.csv`, which the normalizer writes. The third searches raw text for the four hostnames, which are not in CISA's STIX file. The `tier` column tells the analyst how to read a hit: a block hit means something ran, a verify hit needs an owner check, and an alert hit needs context.

```logscale
// 1. Hashes: processes that started from a listed file
#event_simpleName=ProcessRollup2 event_platform=Win
| match(file="iocs.csv", field=SHA256HashData, column=value, include=[tier,
description], ignoreCase=true)
| table([@timestamp, aid, ComputerName, UserName, ImageFileName, CommandLine,
tier, description])
| sort(@timestamp, order=desc)

// 2. Addresses: any connection to a listed IP
#event_simpleName=NetworkConnectIP4
| match(file="iocs.csv", field=RemoteAddressIP4, column=value, include=[tier,
description])
| table([@timestamp, aid, ComputerName, RemoteAddressIP4, RemotePort,
ContextProcessId, tier, description])
| sort(@timestamp, order=desc)

// 3. Hostnames: no context given, so search raw text
@rawstring=/WIN-(SBOE3CPNAL|3IUUOFVTQAR|DK18BI83M0S|I1HRRJHCEIV)/i
| table([@timestamp, #event_simpleName, aid, ComputerName])
| sort(@timestamp, order=desc)
```

Query 1 sees only processes that started. Of the six SHA-256 values, only `SharpShares.exe` is named as a program. The rest are labelled libraries or injected code, such as `locker.dll` and `soc.dll`, which show up in file-write and module-load telemetry instead, so add that source if your tenant keeps it. The ransomware binary (`1.exe`) and NetExec appear only as SHA-1. Search for those in a tool that records SHA-1, or scan files with the YARA rule in Layer 2a.

For an address hit in the alert `tier`, pivot on `ContextProcessId` to the process that made the connection, because the process is the signal. Query 3 searches raw text because the advisory does not say where those names appear. That is slow over a long window, so run it once over the backfill and then over each new 30 days.

### Mullvad is a separate list

The advisory says the actors use Mullvad VPN addresses for initial access (page 4), but it lists none of them, so the STIX file cannot give you a Mullvad block list. Take the server list from Mullvad itself, which publishes [its servers](https://mullvad.net/en/servers) on its own site, and treat it as a second feed that you refresh on a schedule. Apply it where it matters, to the sign-in sources of your VPN gateway and other edge devices, rather than to all outbound traffic. Start in alert mode. Some staff and contractors use consumer VPNs, and a copy of the list goes stale.

### Run it on a schedule

Download the file, normalize it, find which indicators are new, refresh the firewall and proxy lists, replace the SIEM lookup file, and run the 30-day hunt for the new ones. A hit opens a ticket tagged with its `tier`.

### pipeline · 1 file, 4 tiers, 1 hunt

Read it left to right: one file in, four tiers out, and the same file run backwards over old logs.

## Layer 2a: Basic behavioral rules (single-event detections)

Focus. Single events: one process start, one command line, one file written. The advisory names tools and a few actions but prints no command lines, so these rules rest on generic ransomware tradecraft plus the advisory's tool list.

Execution. Community Sigma rules cover the generic behaviors: backup destruction, password-protected archives and rclone. Three new Sigma rules cover what only this advisory names: its tool file names, the `.SafePay` extension and a plain rclone or B2 launch. A YARA rule covers the twelve hashes in CISA's STIX file, and a community YARA set covers ransomware in general.

Goal. High visibility on standard ransomware tradecraft, with each rule able to alert on its own. Every rule here has legitimate users, so run them in detect-only mode first and promote the quiet ones.

### Start with the community rules

SigmaHQ already covers the generic behaviors. Use those instead of writing your own, and read each rule's conditions first, because a title can promise more than the logic delivers.

| Behavior | SigmaHQ rule | What it requires | Gap |
| --- | --- | --- | --- |
| Shadow copy deletion | [Shadow Copies Deletion Using Operating Systems Utilities](https://sigma.controlassurance.com/rules/proc_creation_win_susp_shadow_copies_deletion/) (stable, high) | vssadmin, wmic, diskshadow or PowerShell with shadow and delete on the command line; wbadmin with delete, catalog and quiet; or vssadmin with resize, shadowstorage and unbounded or /MaxSize= | Does not see the service being stopped, which is what the advisory describes |
| System state backup deletion | [SystemStateBackup Deleted Using Wbadmin.EXE](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_wbadmin_delete_systemstatebackup/) (test, high) | wbadmin with delete, systemstatebackup and -keepVersions:0 | wbadmin delete systemstatebackup without -keepVersions:0 does not match |
| 7-Zip with a password | [Compress Data and Lock With Password for Exfiltration With 7-ZIP](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_7zip_password_compression/) (test, medium) | A 7-Zip binary, the -p flag, and a or u as a separate word | Password-protected archives are common in legitimate work |
| WinRAR with a password | [Rar Usage with Password and Compression Level](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_rar_compression_with_password/) (test, high) | The -hp flag plus -m or a as a separate word, with no condition on the binary | Any tool that uses those flags matches, so tune before paging |
| Rclone | [PUA - Rclone Execution](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_pua_rclone_execution) (test, high) | --config, --no-check-certificate and copy; or an rclone binary plus one of a list of words such as copy, sync, config or mega | A plain launch with none of those words does not match |

Rule text as published on SigmaHQ mirrors on 27 October 2026. Rules change, so read the current version in the SigmaHQ repository before you deploy.

Now read the table against the advisory. It says the actors halted the Volume Shadow Copy service and reset NAS devices that held backups. It does not name vssadmin , wbadmin or any 7-Zip option. So the wipe-command and password-archive rules are generic ransomware coverage, not SafePay coverage. Part 2 has a rule for the service stop, and its own recovery-inhibition rule overlaps the first row here. Run one or the other, not both, or a single event pages twice.

### Three rules for what only this advisory names

The community rules cannot know the advisory's file names or its `.SafePay` extension, so these three are new. Each is a Sigma rule that you convert for your backend.

Tool file names. Table 3 lists `dcsync.exe`, `Socks.exe`, `Socks_werfault.exe`, `netscan.exe`, `nxc.exe`, `SharpShares.exe`, `DYRasWtb.exe` and a `wa_3rd_party_host_*.exe` pattern, and the advisory names `ShareFinder.ps1` as a script. A file name is the weakest kind of indicator and the advisory says some of these are legitimate tools, so the level is medium and the false-positive notes name your red team.

```yaml
title: SafePay Advisory Tool File Name Executed
id: 3eeaa9a2-8856-4e53-be8d-ca57153479e2
status: experimental
description: Detects a process started from a file name that AA26-293A lists among SafePay artifacts, or a command line that names ShareFinder.ps1. A file name proves nothing about the file, and the advisory says some listed files are legitimate tools, so treat a hit as a lead to verify, not a verdict.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.credential-access
    - attack.t1003.006
    - attack.discovery
    - attack.t1135
    - attack.t1046
logsource:
    category: process_creation
    product: windows
detection:
    selection_names:
        Image|endswith:
            - '\dcsync.exe'
            - '\Socks.exe'
            - '\Socks_werfault.exe'
            - '\netscan.exe'
            - '\nxc.exe'
            - '\SharpShares.exe'
            - '\DYRasWtb.exe'
    selection_wildcard:
        Image|contains: '\wa_3rd_party_host_'
        Image|endswith: '.exe'
    selection_script:
        CommandLine|contains: 'sharefinder.ps1'
    condition: 1 of selection_*
falsepositives:
    - Authorized red team or penetration testing that uses NetExec (nxc.exe) or SharpShares
    - Administrators who use a legitimate network scanner named netscan.exe
    - Unrelated software that happens to ship a file named Socks.exe
level: medium
```

The `.SafePay` extension. The advisory says files encrypted by this variant are appended with `.SafePay`. This rule confirms encryption rather than preventing it, so its value is speed: group by host and page once.

```yaml
title: SafePay Ransomware File Extension Written
id: fb645b1b-2a31-40b4-93ec-8b037576bc31
status: experimental
description: Detects a file created with the .SafePay extension. AA26-293A says data encrypted by the SafePay variant is appended with .SafePay. This fires once encryption has started, so it confirms an incident rather than preventing one. Expect one event per encrypted file, so group alerts by host.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.impact
    - attack.t1486
logsource:
    category: file_event
    product: windows
detection:
    selection:
        TargetFilename|endswith: '.SafePay'
    condition: selection
falsepositives:
    - A saved sample or report that uses the extension; check the host and the user
level: high
```

Rclone and B2 on any launch. The community rclone rule needs specific options. This one fires on any start of `rclone.exe` or `b2.exe`, which pays off on hosts where neither should exist and is noisy on hosts where they do.

```yaml
title: Rclone or Backblaze B2 Command-Line Tool Executed
id: d2143d53-eaba-4978-82af-ce8614fb2993
status: experimental
description: Detects rclone.exe or b2.exe starting, with no command-line condition. AA26-293A lists RClone for data packaging and exfiltration and says SafePay ran commands through b2.exe to send victim data to Backblaze B2. Both are legitimate tools, so this is a visibility rule for hosts where neither should be installed. The community rclone rule needs specific options and does not cover a plain launch.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.exfiltration
    - attack.t1048
    - attack.t1567.002
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith:
            - '\rclone.exe'
            - '\b2.exe'
    condition: selection
falsepositives:
    - Backup administrators and developers who use rclone or the B2 command-line tool; scope by host group
level: medium
```

### YARA for the listed hashes

The advisory gives hashes but no strings or headers, so there is no signature content to copy from it. What you can do is scan files for the twelve hashes in CISA's STIX file. That is useful where no endpoint sensor runs, such as NAS shares and backup repositories, and it also covers the five SHA-1 values, which Falcon cannot take as indicators.

```yara
import "hash"

rule SafePay_AA26_293A_Listed_Hashes
{
    meta:
        description = "File whose SHA-256, SHA-1 or MD5 hash is listed in CISA advisory AA26-293A or its STIX file"
        reference = "https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf"
        date = "2026-10-27"
        note = "Exact builds only. A rebuilt or repacked file will not match."

    condition:
        hash.sha256(0, filesize) == "921df888aaabcd828a3723f4c9f5fe8b8379c6b7067d16b2ea10152300417eae" or // soc.dll
        hash.sha256(0, filesize) == "6c1d36df94ebe367823e73ba33cfb4f40756a5e8ee1e30e8f0ae55d47e220a6a" or // RunPE bundled DLL
        hash.sha256(0, filesize) == "e79608cf1d6b51324c14bef8883054c1238ed5f080222cc464810e6e14adc346" or // Injected PE
        hash.sha256(0, filesize) == "327b8b61eb446cc4f710771e44484f62b804ae3d262b57a56575053e2df67917" or // locker.dll PE32 executable
        hash.sha256(0, filesize) == "a0dc80a37eb7e2716c02a94adc8df9baedec192a77bde31669faed228d9ff526" or // locker.dll
        hash.sha256(0, filesize) == "bbdd3620a67aedec4b9a68b2c9cc880b6631215e129816aea19902a6f4bc6f41" or // SharpShares.exe
        hash.sha1(0, filesize) == "07353237350c35d6dc2c8f143b649cd07c71f62b" or // 1.exe (ransomware binary)
        hash.sha1(0, filesize) == "b498a2683640c983bb069fa2ea9e67cef4a3797d" or // Locker.dll PE32 executable
        hash.sha1(0, filesize) == "bbfed53e3bb1f306f4da97d995cf4ae5b73ad081" or // locker.dll
        hash.sha1(0, filesize) == "d711a5af5aed48a3b36b98f4fcf52809aebef7a2" or // nxc
        hash.sha1(0, filesize) == "c13bc01d6630d6e51f5dc3d3b0d90d8d499ff240" or // SHA-1 in the SharpShares.exe indicator (STIX file only)
        hash.md5(0, filesize) == "37c1e6931a14601bb136df5985beb0a1" // MD5 in the SharpShares.exe indicator (STIX file only)
}
```

The rule matches only the exact builds listed, so a rebuilt or repacked file will not match. Hashing every file on a large volume is slow, so limit the scan to executables and libraries in the scanner's settings.

For headers and strings, use a maintained community set instead of writing your own. [YARA Forge](https://github.com/YARAHQ/yara-forge/releases) publishes community rules as core, extended and full packages; its latest release, tagged 20261018, lists 5,137 rules in core, 10,811 in extended and 12,452 in full. These sets cover ransomware in general. Test a package against a sample you trust before you rely on it, and expect to tune it before it alerts anyone.

## What these two layers miss

Both layers match what SafePay used, not what it does. The gaps are visible in the advisory's own text.

- Indicators age. The advisory warns that an address tied to malicious activity "may later be reassigned to benign services" and that its indicators describe "historically observed infrastructure within the activity window" (page 19). A rebuilt binary has a new hash, and the advisory reports packing and virtual machine protection to hide code (T1027.002), which also defeats string signatures.

- Names are cheap to change. A file name is the weakest indicator in the tables, and one of them, `Socks_werfault.exe`, is already described as a binary likely masquerading to blend with Windows processes.

- One event cannot tell an administrator from an intruder. Table 1 lists 7-Zip, WinRAR, RClone, PsExec, AnyDesk and ScreenConnect, and adds that these tools "should not be attributed as malicious without analytical evidence". A single-event rule on any of them alerts on your own administrators too.

- Some steps run where no endpoint rule fires. The advisory describes entry through edge devices and resets of NAS devices that held backups. Those happen on firewalls, VPN gateways and storage appliances, which often run no endpoint sensor (inference, not stated in the advisory).

Part 1 of this article shows how we can buy time. Part 2 focuses on building detection coverage that lasts as indicators change and attackers switch tools or roll out variants. It follows the attack through the kill chain, combines behavioral detections with context, identifies blind spots, and tracks what is covered and what still needs work.

## Sources

- [#StopRansomware: SafePay Ransomware, AA26-293A](https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf), CISA, FBI, US Secret Service and partners, 20 October 2026. The source for every statement about the advisory, with page numbers in the text.

- AA26-293A indicator downloads, linked from pages 2 and 4 of the advisory: [STIX JSON](https://www.cisa.gov/sites/default/files/2026-10/AA26-293A-stix.json) and [STIX XML](https://www.cisa.gov/sites/default/files/2026-10/AA26-293A-stix.xml).

- Shared address ranges, read on 27 October 2026: [GitHub meta API](https://api.github.com/meta) and [Cloudflare IP ranges](https://www.cloudflare.com/ips/).

- Mullvad's own server list: [Servers](https://mullvad.net/en/servers) and [About our servers](https://mullvad.net/en/help/server-list).

- Falcon indicator types: [CrowdStrike custom IOC reference](https://developer.crowdstrike.com/cac/terraform/provider/endpoint-security/resources/custom-ioc/).

- Query language reference: LogScale [match()](https://library.humio.com/data-analysis-1.201/functions-match.html) and [in()](https://library.humio.com/data-analysis-1.219/functions-in.html).

- SigmaHQ rules, as published on mirrors on 27 October 2026: [Shadow Copies Deletion Using Operating Systems Utilities](https://sigma.controlassurance.com/rules/proc_creation_win_susp_shadow_copies_deletion/), [SystemStateBackup Deleted Using Wbadmin.EXE](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_wbadmin_delete_systemstatebackup/), [PUA - Rclone Execution](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_pua_rclone_execution), [Compress Data and Lock With Password for Exfiltration With 7-ZIP](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_7zip_password_compression/) and [Rar Usage with Password and Compression Level](https://detection.fyi/sigmahq/sigma/windows/process_creation/proc_creation_win_rar_compression_with_password/).

- [YARA Forge](https://github.com/YARAHQ/yara-forge/releases) releases, release 20261018.
