```json
{
  "title": "SafePay Ransomware (AA26-293A), Part 2: Enhancing Your Defense Posture",
  "metaTitle": "SafePay Ransomware (AA26-293A), Part 2",
  "metaDescription": "Instrument the SafePay attack path: a nine-stage kill chain, detections ordered by how early they fire, hardening checks, validation and reporting.",
  "slug": "safepay-aa26-293a-enhancing-your-defense-posture",
  "openGraphImagePrompt": "Editorial illustration of a network attack path drawn as nine connected stages, two of them on unmonitored edge and backup appliances; no logos or text.",
  "tags": [
    "SafePay",
    "Ransomware",
    "Detection Engineering",
    "Threat Hunting",
    "Threat Intelligence"
  ],
  "keyTakeaway": "Treat SafePay as an attack path to instrument, not a list of indicators to block. Most middle steps can be caught by behavior; entry and recovery sabotage run on appliances that often have no endpoint sensor.",
  "summary": "Part 2 of the SafePay advisory AA26-293A series: deconstruct the kill chain, build detections in the order they fire, close the five CVEs and backup exposure, try to break every rule, and report to leadership and engineers.",
  "author": "David Awosusi",
  "category": "Detection Engineering",
  "publishedAt": "2026-10-28",
  "updatedAt": "2026-10-28",
  "visual": {
    "title": "SafePay's attack path, in order",
    "caption": "Entry and recovery sabotage depend on appliances that usually run no endpoint sensor.",
    "steps": [
      {
        "label": "1. Entry",
        "detail": "Remote-access logins with stolen or guessed credentials, Mullvad source addresses and five edge and backup CVEs."
      },
      {
        "label": "2. Foothold",
        "detail": "Admin rights on existing accounts, new accounts and ScreenConnect for persistence."
      },
      {
        "label": "3. Escalation and credentials",
        "detail": "UAC bypass, token impersonation, Mimikatz and a DCSync tool."
      },
      {
        "label": "4. Defense impairment",
        "detail": "Security software disabled, packed binaries and self-deletion."
      },
      {
        "label": "5. Discovery",
        "detail": "ShareFinder.ps1, SharpShares.exe, netscan, NetExec and nltest."
      },
      {
        "label": "6. Lateral movement",
        "detail": "RDP with valid accounts, PsExec, WinRM and SMB admin shares."
      },
      {
        "label": "7. Staging and exfiltration",
        "detail": "7-Zip and WinRAR archives, then RClone, WinSCP, FileZilla or Backblaze b2.exe."
      },
      {
        "label": "8–9. Recovery sabotage, then encryption",
        "detail": "Shadow copies stopped, NAS backups reset or deleted, then files encrypted with the .SafePay extension."
      }
    ]
  },
  "schema": {
    "title": "What every detection ships with",
    "caption": "A rule's metadata and its validation results together give each kill-chain stage a coverage status.",
    "joinLabel": "rolls up to",
    "standards": [
      {
        "name": "Detection rule",
        "fields": [
          {
            "name": "hypothesis",
            "meaning": "The attacker behavior and why it is observable."
          },
          {
            "name": "attack.id",
            "meaning": "ATT&CK technique and version, for example T1685 in v20."
          },
          {
            "name": "data_source",
            "meaning": "The log it reads and any prerequisite, such as event 4662 auditing."
          },
          {
            "name": "false_positives",
            "meaning": "Known benign matches and the owner who approves exclusions."
          },
          {
            "name": "rollout",
            "meaning": "Detect-only, then alert, then prevent, with promotion criteria."
          }
        ]
      },
      {
        "name": "Validation result",
        "fields": [
          {
            "name": "base_test",
            "meaning": "The lab action that should raise the alert."
          },
          {
            "name": "variant",
            "meaning": "A change in syntax or tooling that tries to break the rule."
          },
          {
            "name": "result",
            "meaning": "Alerted, or logged as a known gap with an owner and a date."
          },
          {
            "name": "fix",
            "meaning": "How the rule changes so it follows the behavior, not the string."
          }
        ]
      }
    ],
    "output": {
      "name": "Kill-chain coverage",
      "fields": [
        "stage",
        "rule",
        "status",
        "owner",
        "due"
      ]
    }
  }
}
```

## Summary

SafePay enters with stolen or guessed credentials and through vulnerable internet-facing systems, moves with built-in admin tools, and destroys backups before it encrypts. [Advisory AA26-293A](https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf) (20 Oct 2026) ties it to at least 600 victims since August 2024, and takes its technical detail from FBI, Secret Service and German state police investigations through August 2026.

Most middle steps can be caught by behavior, because the tools are legitimate and the order is consistent. The exposed steps are entry and recovery sabotage, which run on firewalls, backup servers and NAS devices that often have no endpoint sensor (inference, not stated in the advisory).

## Objective: Deconstruction, Defense, Report

As an advisor, my central focus would be to address SafePay Ransomware concerns as an attack path to instrument, not a list of indicators to block.

1. **Deconstruct.** Read the narrative before the tables. For each behavior, in order, record the ATT&CK technique (re-derive it from the text), the telemetry that would be blind to it, and where no sensor exists. Note what is new against what defenders already know.
2. **Defend.** Rank behaviors by how early they fire and how few false positives they produce. Write each detection as code with a hypothesis, data source, false-positive notes and a test. Run it in detect-only mode, then promote clean rules to prevent. Close exposure in parallel (patching, MFA, backups), because detection is the second line.
3. **Report.** Write for two readers: one page for leadership (are we exposed, top three actions, owners, dates) and a technical report for engineers (confidence, kill chain with coverage status, test results, IOCs as an appendix).

In Falcon terms, Custom IOAs cover endpoint behavior (process, file, network and domain patterns with parent context), Next-Gen SIEM correlation rules cover VPN, identity and backup logs, and Fusion workflows handle containment. At a vendor's scale, add one step before shipping a behavioral rule: retro-hunt historical telemetry to price its false positives. This is a general principal-level workflow, not a description of CrowdStrike's internal process.

## Source and confidence

AA26-293A rests on law-enforcement casework, so treat its behaviors as high confidence and its scale and mix as incomplete.

- **Authors and date.** Published 20 October 2026 by CISA, the FBI, the US Secret Service, Germany's Landeskriminalamt Rheinland-Pfalz, the UK National Crime Agency and the UK's North West Regional Organised Crime Unit.
- **Evidence window.** The advisory says its techniques and indicators were identified through FBI, Secret Service and Landeskriminalamt Rheinland-Pfalz investigations as recently as August 2026, and that the indicators were observed between November 2024 and August 2026.
- **Scale.** At least 600 separate victims from multiple critical infrastructure sectors since August 2024, across North America, South America, Europe and Australia, and one of the most active ransomware groups of 2026, by the advisory's account. It does not split critical infrastructure from other businesses, and leak sites list only victims who refuse to pay, so read 600 as a floor ([Safeguard](https://safeguard.sh/resources/blog/safepay-ransomware-cisa-advisory), [BleepingComputer](https://www.bleepingcomputer.com/news/security/cisa-and-fbi-safepay-ransomware-has-hit-over-600-critical-infrastructure-organizations/)).
- **What is new.** Little. The five CVEs date from 2020 to 2024, and the updated Akira advisory ([AA24-109A](https://www.ic3.gov/CSA/2025/251113.pdf), 13 November 2025) lists the same five with the same weakness labels. Lineage claims (LockBit, ALPHV/BlackCat, INC) come from press commentary, not the advisory. The detail worth building on is recovery sabotage: stopping shadow copies, resetting NAS devices and deleting network-attached backups.
- **ATT&CK version.** The advisory uses ATT&CK for Enterprise v20. In v20, Disable or Modify Tools is T1685 under the Defense Impairment tactic ([MITRE](https://attack.mitre.org/techniques/T1685/)); older content tags it T1562.001. Record the ATT&CK version in every detection's metadata.
- **Tables and narrative disagree.** The narrative and Table 1 cite T1136, T1134.001 and T1550.002, which Tables 6 to 16 omit. Table 12 files brute force under Credential Access, Table 14 files Mimikatz under Archive via Library (T1560.002), and the narrative files remote management and monitoring software under T1569.002, Service Execution. The kill chain below re-derives each mapping from the narrative.
- **Limits of this read.** The advisory gives no timestamps, so stage order follows its narrative, and it names no products for the CVEs. The telemetry and blind-spot columns, and IDs marked re-map, are analysis, not advisory content.

Confidence: high that these behaviors occur in real intrusions, low on how often each one occurs.

## Kill chain: behaviors, ATT&CK IDs, telemetry and blind spots

Nine stages, and two of them (entry and recovery sabotage) depend on devices that usually run no endpoint sensor (inference).

| Stage | SafePay behavior | ATT&CK | Telemetry that sees it | Blind spot |
| --- | --- | --- | --- | --- |
| 1. Entry | Remote-access logins with exposed or phished credentials, brute force, Mullvad source IPs, five CVEs: two on Cisco ASA/FTD edge devices, and three on Veeam and SonicWall systems exploited by automated scripts | T1133, T1190, T1110 (a) | VPN and firewall auth logs, Veeam logs, external exposure scans | Appliances run no endpoint sensor and their logs often never reach the SIEM |
| 2. Foothold | Admin rights on existing accounts, new accounts, ScreenConnect for persistence | T1098, T1136; re-map: T1219.002 | Directory and server audit logs, software and service installs | Remote tools look like IT, and account reviews are often manual |
| 3. Escalation and credentials | COM-based UAC bypass, token impersonation, Mimikatz, a DCSync tool, password changes that lock users out | T1548.002, T1134.001; re-map: T1003.001, T1003.006 | Endpoint process and memory-access events, DC directory-access audit (event 4662) or identity alerts | Event 4662 needs directory-service auditing set up on the domain |
| 4. Defense impairment | Security software disabled before lateral movement, registry and config edits, packed binaries, self-deletion, unnamed built-in binaries used as proxies | T1685, T1027.002, T1070.004, T1218 | Tamper events, Defender log, registry changes, sensor heartbeat gaps | A disabled sensor reports nothing, so alert on missing telemetry too |
| 5. Discovery | ShareFinder.ps1, SharpShares.exe, netscan, NetExec, nltest; output files such as domains.txt and scan.xml | T1059.001, T1059.003; re-map: T1135, T1482, T1046 | Process creation with command lines, SMB enumeration bursts | Scanners resemble inventory tools, and renamed binaries dodge name matching |
| 6. Lateral movement | RDP with valid accounts, PsExec, WinRM, SMB admin shares, remote management tools | T1021.001, T1021.002, T1021.006, T1569.002; re-map for remote tools: T1219.002 | Logon events, service installs (7045, 4697), WinRM logs, endpoint network connections | Admins do the same legitimately, so it needs a per-host baseline |
| 7. Staging and exfiltration | 7-Zip and WinRAR archives (WinRAR splits into .RAR segments), then WinSCP, RClone, FileZilla, OneDrive, Backblaze b2.exe | T1560.001, T1048, T1567 | Process creation, firewall or proxy egress volume and destinations, DNS | Legitimate tools on ordinary ports need a per-host egress baseline |
| 8. Recovery sabotage | Volume Shadow Copy service halted, NAS holding backups reset to factory settings, in some cases all network-attached backups deleted | T1490 | Process events for vssadmin, wmic and diskshadow, backup-platform and NAS audit logs | NAS and backup appliances run no sensor and rarely forward audit logs |
| 9. Encryption and extortion | ChaCha20 and RSA hybrid encryption, full or partial by file type and size, .SafePay extension, ransom note, Tor chat portal, phone calls, leak site | T1486 | File-write and rename bursts, note creation, canary files | Once encryption starts, the question is containment speed, not detection |

(a) The advisory files brute force under Credential Access (Table 12). Behaviors and IDs follow the advisory, except where marked re-map. The telemetry and blind-spot columns, and IDs marked re-map, are analysis derived from the behavior, not advisory content.

### What the indicator tables add

Tables 2 to 5 hint at behavior that the narrative and the ATT&CK tables do not mention. Read them for what the files do, not for names to block.

- **A SOCKS tunnel and a second command channel.** Table 3 lists Socks.exe, described as a tool "used to establish SOCKS proxy for tunneling traffic", and Table 2 lists an address as "soc.dll command and control". The advisory maps neither tunneling nor command and control to a technique.
- **Injection.** Table 5 labels two hashes "RunPE bundled DLL" and "Injected PE", and Table 3 calls locker.dll a "potential ransomware or encryption-related component". Together they suggest the encryptor runs as an injected DLL (inference). The advisory maps no injection technique.
- **Masquerading and cleanup.** Table 3 calls svchost.exe suspicious outside System32, calls Socks_werfault.exe a likely masquerading binary, and marks CCleaner as suspicious in an enterprise "for file cleanup or anti-forensics". Match on path, signer and parent process, not on file name.
- **A tool with no stated role.** Acronis Disk Director appears in Tables 1 and 3 as a legitimate disk management tool, and nothing says what the actors did with it. Treat it as a hunt lead, not a detection.

None of these has a rule in this post. Lab-test any rule you write from them, and verify indicators before blocking, as the advisory cautions.

## Detections to build, earliest first

Order detections by how early in the chain they fire, then by what a false positive costs. Entry rules catch the intrusion before data leaves. Recovery-tampering rules are the last chance before encryption, so they should trigger containment, not a ticket.

| ID | Detection | Stage | Data source | Fidelity | Response |
| --- | --- | --- | --- | --- | --- |
| D1 | Remote-access login succeeds after a burst of failures, comes from a commercial-VPN range, or uses a device profile new to the account | 1 Entry | VPN and firewall authentication logs | Medium; tune per tenant | Alert, force re-authentication, review the account |
| D2 | Account created, or added to an admin group, outside a change window | 2 Foothold | Security events 4720, 4728, 4732, 4756 | Medium | Alert; match against a change ticket |
| D3 | Remote-access tool installed as a service and not on the approved list | 2 Foothold | System event 7045, endpoint process data | Medium; needs an allowlist | Alert; isolate the host if unapproved |
| D4 | Directory replication rights used by a non-machine account (DCSync pattern) | 3 Escalation and credentials | Security event 4662 | High | Page; disable the account |
| D5 | Microsoft Defender disabled or excluded from the command line | 4 Defense impairment | Endpoint process creation | High | Alert; isolate the host |
| D6 | Endpoint sensor goes silent while the host stays active on the network | 4 Defense impairment | Sensor heartbeat compared with DHCP, VPN or directory logs | Medium | Alert; check the host |
| D7 | PsExec-style service installed on a remote host | 6 Lateral movement | System event 7045, endpoint process data | Medium | Alert; review the source host and account |
| D8 | Archive tool followed by a transfer tool (rclone, WinSCP, FileZilla, b2) on one host | 7 Staging and exfiltration | Endpoint process creation, egress logs | Medium; baseline first | Alert; block egress |
| D9 | Shadow copies, backup catalogs or boot recovery deleted, or the Volume Shadow Copy service stopped | 8 Recovery sabotage | Endpoint process creation, backup and NAS audit logs | High | Contain the host automatically |

Stage numbers match the kill-chain table above. D1 and the backup and NAS side of D9 depend on appliances that run no endpoint sensor, so confirm those logs reach your SIEM before you build on them.

### D1: write the logic first, then map it to your vendor

Firewall and VPN log formats differ too much to ship one rule, so write D1 as logic and map it to your fields.

- **Failures, then success.** A successful login for an account after [N] or more failures within [T] minutes from one source address.
- **Commercial-VPN source.** A login from an address range owned by a consumer VPN provider. The advisory names one such provider, Mullvad, whose IP addresses the actors used to attain initial access. Use the range as an enrichment signal, not a block list, and verify addresses before blocking, as the advisory also advises.
- **New device profile.** The first login for this account from this client fingerprint.

Set N and T from two weeks of your own history. Page on two or more signals together, and send a single signal to a low-priority queue.

### Sigma rules

These are starting points, not production rules. Lab-test them and baseline your own environment before you enable any of them.

**D3. Remote-access tool installed as a service** (T1219.002, T1543.003). All three tools are legitimate, so alert only outside your approved list.

```yaml
title: Remote Access Tool Installed as a Service
id: b7d2f6a0-8e35-4c19-a4b1-0f9c3e5d7a82
status: experimental
description: Detects service installation for ScreenConnect, AnyDesk or TeamViewer. AA26-293A lists ScreenConnect for persistence and AnyDesk and TeamViewer for delivering the ransomware. All three are legitimate, so alert only outside your approved list.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.persistence
    - attack.command-and-control
    - attack.t1543.003
    - attack.t1219.002
logsource:
    product: windows
    service: system
detection:
    selection:
        EventID: 7045
        ImagePath|contains:
            - 'ScreenConnect.ClientService.exe'
            - '\AnyDesk.exe'
            - 'TeamViewer_Service.exe'
    condition: selection
falsepositives:
    - Approved IT remote support deployments; filter by host group and install source
level: medium
```

**D4. Directory replication by a non-machine account** (T1003.006). Event 4662 appears only if directory-service access auditing is on for the domain, so confirm that first. Allowlist directory sync accounts such as Entra Connect by name.

```yaml
title: Directory Replication Rights Used by a Non-Machine Account
id: 9d2e7a14-5c3b-4f80-a1d6-8b4c0e7f2a35
status: experimental
description: Detects directory replication access (the DCSync pattern) by an account that is not a domain controller machine account. AA26-293A lists a DCSync tool among SafePay artifacts. Needs directory-service access auditing on the domain object.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.credential-access
    - attack.t1003.006
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4662
        AccessMask: '0x100'
        Properties|contains:
            - '1131f6aa-9c07-11d1-f79f-00c04fc2dcd2'
            - '1131f6ad-9c07-11d1-f79f-00c04fc2dcd2'
            - '89e95b76-444d-4c62-991a-0facbeda640c'
    filter_machine_accounts:
        SubjectUserName|endswith: '$'
    condition: selection and not filter_machine_accounts
falsepositives:
    - Directory synchronization service accounts such as Entra Connect; allowlist them by name
level: high
```

**D5. Defender disabled or excluded through PowerShell** (T1685). The advisory names Windows Defender as a target when the actors use RDP and LOLBins (Table 13). This is one method among several. Registry edits, service stops and the settings app need their own rules, which the Validation section tests.

```yaml
title: Microsoft Defender Disabled or Excluded via PowerShell
id: e51b8d27-4a0c-4c3e-8d92-1f6a7b3c0d58
status: experimental
description: Detects Defender real-time protection being disabled or exclusions being added from the command line. AA26-293A describes SafePay disabling security software before lateral movement.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.defense-impairment
    - attack.t1685  # ATT&CK v20; older toolchains know this as attack.t1562.001
logsource:
    category: process_creation
    product: windows
detection:
    selection_img:
        Image|endswith:
            - '\powershell.exe'
            - '\pwsh.exe'
    selection_cmdlet:
        CommandLine|contains:
            - 'Set-MpPreference'
            - 'Add-MpPreference'
    selection_setting:
        CommandLine|contains:
            - 'DisableRealtimeMonitoring'
            - 'ExclusionPath'
            - 'ExclusionProcess'
            - 'ExclusionExtension'
    condition: all of selection_*
falsepositives:
    - Administrators adding approved exclusions; correlate with change tickets
level: high
```

**D7. PsExec-style service installation** (T1021.002, T1569.002). Renamed copies are not covered, so pair this with a process rule on the target host.

```yaml
title: PsExec-Style Remote Service Installation
id: c47a1e93-2b6d-4d58-9f0a-7e3b5d81c2f4
status: experimental
description: Detects service installation by PsExec or PAExec, a remote execution method AA26-293A lists for SafePay lateral movement. Renamed copies are not covered, so pair this with process rules on the target host.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.lateral-movement
    - attack.t1021.002
    - attack.t1569.002
logsource:
    product: windows
    service: system
detection:
    selection:
        EventID: 7045
    selection_names:
        - ServiceName|startswith:
              - 'PSEXESVC'
              - 'PAExec'
        - ImagePath|contains:
              - '\PSEXESVC.exe'
              - '\PAExec'
    condition: selection and selection_names
falsepositives:
    - Administrators and deployment tools that use PsExec; baseline approved source hosts and accounts
level: medium
```

**D9a. Recovery inhibition commands** (T1490). Backup and imaging software that manages shadow copies will match, so scope exclusions by parent process and service account.

```yaml
title: Recovery Inhibition via Shadow Copy or Boot Configuration Commands
id: 3b8f4c52-7d1e-4a96-b0c3-5e2a91d4f6a1
status: experimental
description: Detects commands that delete shadow copies or backup catalogs or switch off Windows recovery. AA26-293A describes SafePay halting the Volume Shadow Copy service, resetting NAS devices and deleting network-attached backups to inhibit recovery.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.impact
    - attack.t1490
logsource:
    category: process_creation
    product: windows
detection:
    selection_vssadmin:
        Image|endswith: '\vssadmin.exe'
        CommandLine|contains|all:
            - 'delete'
            - 'shadows'
    selection_wmic:
        Image|endswith: '\wmic.exe'
        CommandLine|contains|all:
            - 'shadowcopy'
            - 'delete'
    selection_wbadmin:
        Image|endswith: '\wbadmin.exe'
        CommandLine|contains|all:
            - 'delete'
            - 'catalog'
    selection_bcdedit:
        Image|endswith: '\bcdedit.exe'
        CommandLine|contains:
            - 'recoveryenabled no'
            - 'ignoreallfailures'
    condition: 1 of selection_*
falsepositives:
    - Backup and imaging software that manages shadow copies; scope by parent process and service account
level: high
```

**D9b. Volume Shadow Copy service stopped or disabled** (T1490). The advisory says SafePay halts this service and does not say how, so this rule covers the common commands.

```yaml
title: Volume Shadow Copy Service Stopped or Disabled from the Command Line
id: 6a1f0d83-2c47-4e59-9b0a-d3e8157c4f26
status: experimental
description: Detects net, sc or PowerShell commands that stop or disable the Volume Shadow Copy service. AA26-293A describes SafePay halting this service to inhibit recovery and does not say how. This rule covers the common stop and disable commands.
references:
    - https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf
date: 2026-10-27
tags:
    - attack.impact
    - attack.t1490
logsource:
    category: process_creation
    product: windows
detection:
    selection_tool:
        Image|endswith:
            - '\net.exe'
            - '\net1.exe'
            - '\sc.exe'
            - '\powershell.exe'
            - '\pwsh.exe'
    selection_action:
        CommandLine|contains:
            - ' stop '
            - 'stop-service'
            - 'set-service'
            - 'start= disabled'
    selection_service:
        CommandLine|contains:
            - 'vss'
            - 'volume shadow copy'
    condition: all of selection_*
falsepositives:
    - Backup, imaging or maintenance scripts that stop the service briefly; scope by parent process and account
level: medium
```

### CQL sketches for Falcon Next-Gen SIEM

Untested. The field names follow public Falcon examples, so confirm them in your tenant and run each query as a hunt over 30 days of history before you turn it into a rule. The first three mirror Sigma rules above. The last has no Sigma twin because it needs a sequence.

**D9. Recovery tampering.**

```
#event_simpleName=ProcessRollup2 event_platform=Win
| ImageFileName=/\\(vssadmin|wmic|wbadmin|bcdedit|diskshadow)\.exe$/i
| CommandLine=/(delete\s+shadow|shadowcopy\s+delete|delete\s+catalog|recoveryenabled\s+no|ignoreallfailures)/i
| table([@timestamp, aid, ComputerName, UserName, ParentBaseFileName, ImageFileName, CommandLine])
| sort(@timestamp, order=desc)
```

**D7. PsExec-style service running on the target host.**

```
#event_simpleName=ProcessRollup2 event_platform=Win
| ParentBaseFileName=/^services\.exe$/i
| ImageFileName=/\\(PSEXESVC|PAExec[^\\]*)\.exe$/i
| table([@timestamp, aid, ComputerName, ImageFileName, CommandLine])
| sort(@timestamp, order=desc)
```

**D5. Defender tampering.**

```
#event_simpleName=ProcessRollup2 event_platform=Win
| ImageFileName=/\\(powershell|pwsh)\.exe$/i
| CommandLine=/(Set|Add)-MpPreference/i
| CommandLine=/(DisableRealtimeMonitoring|Exclusion(Path|Process|Extension))/i
| table([@timestamp, aid, ComputerName, UserName, ParentBaseFileName, CommandLine])
| sort(@timestamp, order=desc)
```

**D8. Archive tool and transfer tool on the same host.** This matches by file name, so a renamed binary slips through. Add a command-line variant (rclone's transfer flags, for example) once you have a baseline.

```
#event_simpleName=ProcessRollup2 event_platform=Win
| ImageFileName=/\\(7z|7za|7zG|WinRAR|rar|rclone|WinSCP|FileZilla|b2)\.exe$/i
| case {
    ImageFileName=/\\(7z|7za|7zG|WinRAR|rar)\.exe$/i | tool := "archive";
    * | tool := "transfer";
  }
| groupBy([aid, ComputerName], function=[collect([tool]), count(as=runs)])
| tool=/archive/
| tool=/transfer/
```

For prevention on the endpoint, a Custom IOA process-creation rule can match the same patterns with regex on Image Filename and Command Line, plus parent and grandparent context. Port D5 and D9 first, because they have the lowest false-positive cost. Run them in detect-only mode before you promote them.

### What every rule ships with

- **Hypothesis.** One sentence on the attacker behavior and why it is observable.
- **ATT&CK ID and version,** for example T1685 in v20.
- **Data source and prerequisite,** for example directory-service auditing for event 4662.
- **False-positive notes,** with a named owner who can approve exclusions.
- **Test.** The emulation command and the alert it should raise (see Validation).
- **Rollout.** Detect-only, then alert, then prevent, with the promotion criteria written down.
- **Retirement.** The condition under which the rule is deleted.

## Hardening and exposure checks

Detection is the second line. Close the paths SafePay used first, and prove each one closed with a check, not an assumption.

### The five CVEs

| CVE | Product | Weakness | What to do |
| --- | --- | --- | --- |
| CVE-2020-3259 | Cisco ASA and FTD, web services interface | CWE-200, exposure of sensitive information | Install a fixed release, and do not expose the interface without need |
| CVE-2023-20269 | Cisco ASA and FTD, remote access VPN | CWE-288, authentication bypass through an alternate path | Install a fixed release, review VPN profiles, and require MFA on each |
| CVE-2023-27532 | Veeam Backup & Replication | CWE-306, missing authentication for a critical function | Install the fixed build, and keep the backup server off the internet |
| CVE-2024-40711 | Veeam Backup & Replication | CWE-502, deserialization of untrusted data | Install the fixed build, and limit which hosts can reach the server |
| CVE-2024-40766 | SonicWall SonicOS | CWE-284, improper access control | Update SonicOS, then reset local account credentials and require MFA, because patching does not revoke credentials already taken |

The advisory lists the CVE IDs and their weaknesses and names no products. Product and component names come from the updated Akira advisory ([AA24-109A](https://www.ic3.gov/CSA/2025/251113.pdf)) and public CVE write-ups. Check each CVE against CISA's Known Exploited Vulnerabilities catalog and the vendor's list of fixed versions.

### Exposure checks to run this week

| Check | How to run it | Pass when |
| --- | --- | --- |
| MFA on every remote path | List VPN profiles, web portals, remote-management consoles and local appliance accounts, then test each login path with a password alone | No path accepts a password alone |
| Brute-force controls | Read the lockout policy and VPN rate limits, then search authentication logs for failure bursts from one source | Bursts lock the account or block the source |
| New accounts and admin rights | List accounts created, and admin-group changes made, in the last 90 days | Every one matches a ticket and has an owner |
| Remote-tool inventory | Search software inventory and service lists for ScreenConnect, AnyDesk, TeamViewer and similar tools | Every install is approved and owned |
| Backup reachability | From an ordinary admin credential, try to reach and delete a backup copy on the NAS, the backup server and the repository | The attempt fails, and an offline or immutable copy exists |
| Restore test | Restore a representative system from the immutable copy and time it | Restore time meets the recovery objective the business signed off |
| External exposure | Scan your external ranges for VPN portals and backup-server ports, and compare with the asset list | Only intended services answer |
| Appliance logging | Generate a test event on each VPN, firewall, backup server and NAS | Each event reaches the SIEM within your agreed delay |

### Order of work

Entry and recovery sabotage usually run on devices with no endpoint sensor, so fixes there remove the most exposure.

1. **Edge first.** Patch the five CVEs, put MFA on every remote path, and forward appliance logs to the SIEM.
2. **Backups next.** Make them unreachable from admin credentials, and prove a restore.
3. **Identity.** Review new accounts, admin rights and remote tools.
4. **Detections.** Turn on the rules above in detect-only mode, then validate them (next section).

The advisory's own mitigation list covers patching known exploited vulnerabilities, identity and access management with MFA, current password guidance, offline encrypted immutable backups, segmentation, monitoring with EDR, traffic filtering, account review, just-in-time admin access, restricting command-line and scripting use, and validating controls against the mapped ATT&CK behaviors. The checks above turn most of those into tests.

## Validation: try to break each detection

A detection is a hypothesis until it fires on real behavior. For each rule, run the base behavior and confirm the alert, then change the syntax until the rule goes quiet, and fix it so it follows the behavior instead of the string. The advisory asks for the same loop: pick a technique from Tables 6 to 16, test your controls against it, analyze the result and tune.

| Rule | Base test (lab) | Variant that should break it | Fix if it breaks |
| --- | --- | --- | --- |
| D1 | Replay a burst of failures followed by a good login from a test source | Spread attempts thinly, one per account per hour across many accounts, or log in from a residential proxy instead of a VPN range | Count distinct accounts per source, add a long per-account window, and score the device profile too |
| D3 | Install each remote tool as a service in the lab | Run AnyDesk portable, which needs no service | Add a process rule for these tools running from user-writable paths, plus DNS and egress checks |
| D4 | In a lab domain, grant a test account replication rights and run a directory sync from a non-DC host | Run the sync as a machine account the attacker created, which the `$` exclusion hides | Replace the `$` exclusion with an allowlist of your real domain controller accounts |
| D5 | Run the Set-MpPreference change from a PowerShell session | Make the same change through the registry, stop the Defender service, or use the settings app; also test with tamper protection on | Add rules for registry and service changes, and alert on blocked tamper attempts too |
| D7 | Run PsExec against a lab host | Set a custom service name with the `-r` option, rename the binary, or use WinRM or WMI instead | Add the target-host process rule from the D7 CQL sketch, and a rule for a remote logon followed by a service install |
| D8 | Zip a test folder, then copy it to a local test destination with rclone | Rename rclone, drive WinSCP in script mode, or use a cloud provider's own command-line tool | Match rclone's transfer flags in the command line, and baseline egress volume per host |
| D9 | Run the shadow-copy and boot-recovery commands on a disposable VM | Delete through WMI or PowerShell, run diskshadow with a script file, stop the service with the Stop-Service alias, or run a renamed copy of vssadmin | Match on the PE original file name instead of the path, and add the WMI, PowerShell and alias forms |

A rule passes when the base test alerts and every variant either alerts or is logged as a known gap with an owner and a date. Record the result of each variant, failures included. A rule with documented gaps is more useful than one assumed complete.

**Tools.** Atomic Red Team carries tests for most of these techniques. For Defender tampering, search for the older ID T1562.001 as well as T1685. Caldera can chain the steps into a full run, and AttackIQ and SafeBreach have published coverage of this advisory that is worth comparing with your own results.

**Safety.** Run every test in an isolated lab you own, on virtual machines you can revert and with no route to production. Several of these tests delete backups or disable protection by design.

## Reporting: one page for leadership, one report for engineers

Write the one-pager first. If you cannot say what happened, whether you are exposed and what you need in a page, the technical report is not ready either. Fill the bracketed parts with your own facts.

### Executive one-pager

**Subject.** SafePay ransomware (CISA AA26-293A): exposure and actions.

**What happened.** On 20 October 2026, CISA, the FBI and partner agencies published an advisory on SafePay ransomware, tied to at least 600 victims since August 2024. [One sentence on why it matters to us: our sector, and the edge devices and backup products we share with the victims.]

**Are we exposed?**

| Question | Answer | Owner | Due |
| --- | --- | --- | --- |
| Do we run any of the five vulnerable products, and which versions? | [Yes or no, with the list] | [Name] | [Date] |
| Is MFA on every remote access path? | [Yes or no] | [Name] | [Date] |
| Can an admin credential reach and delete our backups? | [Yes or no] | [Name] | [Date] |
| Would we detect each stage of the attack chain? | [Stages covered out of nine; see the report] | [Name] | [Date] |

**Top three actions.**

1. [Action, owner, date]
2. [Action, owner, date]
3. [Action, owner, date]

**Residual risk.** [What remains after those actions, for example appliances we cannot monitor yet.]

**Decision needed.** [One ask: budget, a downtime window, or a policy exception.]

### Technical report outline

1. **Source and confidence.** The advisory, its date, what you read and what you could not, and your confidence in each claim.
2. **Kill chain with coverage status.** The nine-stage table with a status for each stage (covered, partial or gap) and the rule that covers it.
3. **Detections shipped.** Rule ID, mode (detect-only, alert or prevent), data source, and the false-positive rate from the retro-hunt.
4. **Validation results.** The base test and every variant with its result, including failures and known gaps.
5. **Exposure findings.** The five CVEs, MFA, accounts, remote tools and backups, each with an owner and a due date.
6. **Hunt results.** What you searched for over the last [90] days, and what you found.
7. **IOC appendix.** Indicators from the advisory, marked verify before blocking, as the advisory cautions.
8. **Open risks and decisions.**

### Metrics that belong in the report

| Metric | Question it answers | How to measure |
| --- | --- | --- |
| Behavior coverage | How much of the attack chain do we see? | Stages with at least one rule that passed its base test, out of nine |
| Time to detect | How fast does an alert reach a person? | Minutes from the emulated action to the alert in the queue, per test |
| False positives | What does each rule cost the analysts? | Alerts per 1,000 endpoints per week from the retro-hunt, per rule |
| Exposure | How many doors are open? | Internet-facing devices on a vulnerable version or without MFA |
| Restore time | Can we recover without paying? | Minutes to restore a representative system from the immutable copy |
| Log source value | Is each log worth its ingest cost? | Stages each log source makes visible, against its ingest cost |

## Sources

**Primary source**

- [CISA advisory AA26-293A, #StopRansomware: SafePay Ransomware](https://www.cisa.gov/sites/default/files/2026-10/aa26-293a-stopransomware-safepay-ransomware-508c_0.pdf), 19 pages, published 20 October 2026. The behaviors, tools, CVEs, ATT&CK IDs and mitigations in this post were checked against its text and Tables 1 to 16.
- [CISA, FBI and partners, #StopRansomware: Akira Ransomware, AA24-109A](https://www.ic3.gov/CSA/2025/251113.pdf), updated 13 November 2025: the same five CVEs with the same weakness labels, and the Veeam and SonicWall product names.

**Coverage and references read for this post**

- [CISA announcement bulletin](https://content.govdelivery.com/accounts/USDHSCISA/bulletins/42fd782): advisory identifier, publication date, victim count and the regions affected.
- [BleepingComputer](https://www.bleepingcomputer.com/news/security/cisa-and-fbi-safepay-ransomware-has-hit-over-600-critical-infrastructure-organizations/): press coverage of the victim count, and why leak-site counts understate victims.
- [Safeguard](https://safeguard.sh/resources/blog/safepay-ransomware-cisa-advisory): an early summary of the CVE list, and why leak-site counts understate victims.
- [SafeBreach on Security Boulevard](https://securityboulevard.com/2026/10/safepay-ransomware-safebreach-coverage-for-cisa-alert-aa26-293a/): a second reading of the advisory's tables and indicator categories, used as a cross-check.
- [AttackIQ](https://www.attackiq.com/2026/10/21/response-to-cisa-advisory-aa26-293a/): behavior-by-behavior summary used to cross-check the kill chain.
- [eSecurityPlanet](https://www.esecurityplanet.com/threats/news-fbi-safepay-ransomware-600-organizations/) and [Infosecurity Magazine](https://www.infosecurity-magazine.com/news/safepay-compromised-critical/): additional coverage used to cross-check the CVE list and headline figures.
- [MITRE ATT&CK T1685, Disable or Modify Tools](https://attack.mitre.org/techniques/T1685/) and [T1219, Remote Access Tools](https://attack.mitre.org/techniques/T1219/): technique names and IDs.
- [CrowdStrike tech center, Custom IOAs](https://www.crowdstrike.com/blog/tech-center/custom-ioas/): Custom IOA rule types and regex fields.
- Public CVE write-ups used to check product and component names: [NVD for CVE-2023-20269](https://nvd.nist.gov/vuln/detail/CVE-2023-20269), [Rapid7 for CVE-2020-3259](https://www.rapid7.com/db/vulnerabilities/cisco-asa-cve-2020-3259), [Help Net Security for CVE-2024-40766](https://www.helpnetsecurity.com/2024/08/26/cve-2024-40766/) and [for CVE-2024-40711](https://www.helpnetsecurity.com/2024/09/09/cve-2024-40711-exploited/), and [Action1 for CVE-2023-27532](https://www.action1.com/vulnerabilities/cve-2023-27532/).
