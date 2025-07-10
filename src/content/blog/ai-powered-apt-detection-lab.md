---
layout: ../../layouts/BlogPost.astro
title: "Building an AI-Powered APT Detection Lab"
description: "A practical guide to simulating, detecting, and analyzing APT-like behavior using AI-driven tooling, open source frameworks, and GCP."
pubDate: "2025-07-09"
heroImage: "../../assets/blog-placeholder-2.jpg"
---

## Overview

Welcome to my first deep-dive project: a cloud-based **AI-Powered APT Detection Lab** designed to simulate advanced persistent threats (APTs), collect telemetry, and apply machine learning for detection — all within Google Cloud Platform (GCP).

This lab is built for SOC analysts, threat hunters, and detection engineers looking to gain real-world experience with:
- AI-assisted detection
- Simulated APT behavior
- Modern SIEM + SOAR workflows
- Elastic Stack, Splunk, or Security Onion

## Lab Goals

The goal is to replicate a full detection lifecycle using adversary simulation tools (like Atomic Red Team and Caldera), while capturing and analyzing logs with scalable infrastructure.

### Key Objectives:
- Simulate APT-like activity using red team frameworks
- Collect host/network telemetry via Zeek, Sysmon, Suricata, Velociraptor
- Feed data into a central SIEM (Elastic or Splunk)
- Apply AI/ML (Elastic ML or Splunk MLTK) to detect anomalies
- Use SOAR/playbooks to triage findings

## Architecture

The lab is deployed on GCP using Terraform with auto-created instances for:
- **Red Team VM**: Caldera + Atomic Red Team
- **Victim VM**: Windows/Linux endpoint with agents (Velociraptor, Sysmon)
- **Sensor VM**: Zeek, Suricata
- **SIEM VM**: Splunk or Elastic
- *(Optional)*: Sentinel for blue team comparison

Resources are auto-created and can be shut down to reduce cost using GCP credits.

## Stack Highlights

- ✅ **Elastic Stack / Splunk**: Core SIEM + ML detection
- ✅ **Velociraptor**: DFIR + live response agent
- ✅ **Zeek/Suricata**: Network telemetry
- ✅ **Caldera**: APT-style behavior simulation
- ✅ **Terraform**: IaC deployment
- ✅ **GCP**: Cloud-native + cost-effective

## Current Status

- Infrastructure code is complete and working with GCP credits
- Working on detection rules for C2 beaconing and PowerShell abuse
- Building a LLM-based parser for noisy logs → summarized findings
- Soon integrating FleetDM + Osquery to add visibility across VMs

## What’s Next?

- Auto-tagging alerts using AI
- Detection-as-code pipelines
- Exporting dashboards and hunt reports
- Packaging this as an LMS module for training SOC analysts

## Get Involved

You can clone or fork the project here:

👉 [glaciergh0st/AI-APT-detection-lab on GitHub](https://github.com/glaciergh0st/AI-APT-detection-lab)

Feel free to open issues, ask questions, or contribute ideas!

---

Thanks for reading — follow along as I refine this lab into a reusable blueprint for blue teamers.

