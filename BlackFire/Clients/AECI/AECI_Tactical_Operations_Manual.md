# AECI CHEMPARK — TACTICAL OPERATIONS MANUAL
## Armed Response Protocols & Site-Specific Procedures

**BlackFire Solutions**  
**Confidential — For Authorized Personnel Only**

---

## SECTION 1: SITE OVERVIEW & THREAT ASSESSMENT

### Facility Profile
- **Client**: AECI Chempark (Modderfontein, Johannesburg)
- **Site Classification**: Industrial/Commercial Chemical Processing
- **Perimeter**: [Specify: fence length, gates, vulnerable points]
- **Personnel**: [Specify: site staff, shift patterns, visitor protocols]
- **Critical Assets**: [Specify: chemical storage, equipment, control systems]
- **Nearest SAPS Station**: [Specify: station name & distance]
- **Emergency Services**: [Specify: ambulance, fire service response times]

### Threat Profile (Historical & Current)

| Threat Type | Historical Incidents | Current Risk | Response Level |
|---|---|---|---|
| Attempted Intrusion/Theft | 2-3 per year | Medium | Tier 2 |
| Perimeter Breach | 1-2 per year | Low-Medium | Tier 2 |
| Vandalism/Sabotage | 1 per quarter | Low | Tier 1 |
| Industrial Espionage | Minimal | Low | Tier 1-2 |
| Trespassing | 1-2 per month | Medium | Tier 1 |
| Public Perimeter Encroachment | Ongoing risk | Medium | Tier 1 (Drone) |
| Adjacent Land Fire | Seasonal risk (dry season) | Medium-High | Tier 1 (Drone + Fire Dept) |

**Note**: Previous armed guard provider added configuration instability; actual threats were masked by false alarms. Current risk profile likely stabilizes once alarm system is consistently configured.

---

## SECTION 2: TIER 1 AUTOMATED RESPONSE (Control Room Protocol)

### Alert Classification & Drone Deployment Decision Tree

```
FENCE/ALARM TRIGGER
    │
    ▼
Control Room logs alert → Drone operator notified immediately
    │
    ▼
DRONE DEPLOYED TO ALERT ZONE (every alert, no exceptions)
    │
    ├─ Sensor Anomaly Detected (gradual drift, no active breach visible)
    │   └─ → DIAGNOSTIC — schedule maintenance; notify AECI site manager
    │       No tactical dispatch
    │
    ├─ False Alarm Confirmed (wind, animal, vegetation — no breach visible)
    │   └─ → LOG & CLOSE — root cause noted; config review scheduled
    │       No tactical dispatch
    │
    ├─ Unclear (poor visibility, obscured zone, inconclusive)
    │   └─ → ESCALATE TO TIER 3 — tactical dispatch; drone continues overhead
    │
    └─ Genuine Threat Confirmed (breach visible, suspect visible, tracks/damage)
        └─ → TIER 3 DISPATCH IMMEDIATE — tactical unit dispatched with live feed
```

### Control Room Actions for Tier 1

**Alert Response Protocol**:
1. **Receive Alert** (auto-logged with timestamp)
2. **Notify drone operator** (immediately; operator begins launch prep)
3. **Classify via sensor data** (historical patterns, diagnostics) while drone en route
4. **Drone aerial assessment** (primary confirmation method)
5. **Decision** (Control Room manager + drone operator jointly):
   - ✅ **False Alarm** → Log as FP; root cause recorded; no dispatch
   - 🔧 **Diagnostic** → Maintenance scheduled; site manager notified; no dispatch
   - ⚠️ **Unclear** → Escalate to Tier 3 (tactical dispatch with live drone support)
   - 🚨 **Genuine** → Tier 3 dispatch immediately; drone continues aerial coverage

**Communication to Site Manager**:
- For FALSE ALARM: Email summary (next business day)
- For ESCALATION: SMS alert + email incident log
- For RESOLVED: All-clear notification once verified

### Tier 1 System Maintenance

**Daily Diagnostics** (automated):
- Sensor health check (04:00 am)
- Connectivity verification (every 6 hours)
- Alarm threshold validation (automated)

**Weekly Manual Check** (Control Room technician):
- Log review (false alarm trends)
- Sensitivity calibration assessment
- Configuration consistency check

**Monthly Site Visit** (technician + site manager):
- Physical fence inspection
- Sensor alignment check
- Historical incident review & protocol update

---

## SECTION 3: TIER 2 ARMED RESPONSE DISPATCH

### Dispatch Trigger & Authorization

**Tier 2 Dispatch Authorized When**:
- ✅ Sustained fence breach alert (>5 seconds, multi-sensor confirmation)
- ✅ Intrusion alarm triggered + CCTV confirms movement
- ✅ Multiple alert zones in rapid sequence (coordinated attack pattern)
- ✅ Site manager manual panic button activated
- ✅ After-hours access alert without prior authorization
- ✅ CCTV footage shows suspicious activity (human-sized movement)

**Tier 2 Dispatch NOT Authorized For**:
- ❌ Single sensor spike (<2 seconds)
- ❌ Suspected wildlife/wind-triggered alerts
- ❌ Known maintenance activity (pre-announced)
- ❌ Weather-related false alarms (high wind, rain)

### Dispatch Process

**Step 1: Control Room Assessment** (0-2 minutes)
- Alert received & logged
- CCTV footage reviewed (if available)
- Alert pattern analyzed against historical data
- **Decision**: Genuine threat? → YES = dispatch; NO = monitor

**Step 2: Team Notification** (0-1 minute)
- Armed response team receives dispatch call
  - Location: AECI Chempark
  - Alert type: [Fence breach / Intrusion / etc.]
  - Details: [Specific zone, signal strength, CCTV observations]
  - Suspect info: [Any visual description available]

**Step 3: Team Mobilization** (1-5 minutes)
- Team confirms receipt
- Vehicle pre-flight check (comms, weapons, flashlights)
- Route determination (fastest safe route to site)
- En-route notification sent to Control Room

**Step 4: Site Arrival** (5-8 minutes from dispatch)
- Team checks in via radio
- Site manager notified (if daytime)
- Perimeter entry point confirmed with Control Room

**Timeline Target**: Alert → Dispatch = 2 min; Dispatch → Site Arrival = 8 min MAX

---

## SECTION 4: TACTICAL RESPONSE PROCEDURES

### 4.1 Standard Intrusion Response (Daytime / Site Manager Present)

#### Phase 1: Perimeter Security (0-5 minutes on-site)

**Arrival Protocol**:
1. Armed team enters via authorized gate (Control Room confirms site manager okayed entry)
2. Team parks vehicle in secure location (not blocking suspects)
3. Radio check-in: "BlackFire Tactical, on-site, perimeter secure"

**Initial Assessment**:
- Locate breach point (fence section, gate, climbing evidence)
- Check for active suspect activity (movement, tools, vehicles)
- Photograph evidence (breach location, tools, footprints if visible)
- Radio status to Control Room: "Fence breach confirmed at [location], no active suspects visible"

**Perimeter Sweep** (if breach is confirmed):
- Team conducts visual inspection of: perimeter within 20m of breach, fence line integrity, surrounding area for suspect vehicles
- Do NOT pursue suspects beyond perimeter (jurisdiction issue; let SAPS handle)
- Document all findings via radio

#### Phase 2: SAPS Notification & Evidence Preservation (5-10 minutes on-site)

**Escalation Protocol**:
1. Control Room notifies SAPS immediately:
   - Location: AECI Chempark, [specific area]
   - Incident: Fence breach / intrusion attempt
   - Status: Breach confirmed, no active suspect, perimeter secured
   - Contact: Control Room on-call manager [phone]

2. Armed team secures perimeter:
   - Place "Do Not Cross" tape around breach area
   - Ensure no contamination of evidence
   - Keep area clear for SAPS investigation

3. Document evidence:
   - Photos: breach location, tools, footprints, vehicle tracks
   - Measurements: breach height, width, tool marks on fence
   - Timeline: exact times of alert, arrival, discovery

#### Phase 3: Handover to SAPS (10-15 minutes on-site)

**SAPS Coordination**:
- SAPS investigator arrives (typically 15-30 minutes from station)
- BlackFire team briefs SAPS on incident timeline:
  - Alert received at [time]
  - BlackFire arrived at [time]
  - Breach discovered at [time]
  - No suspect apprehension attempted
  - Evidence preserved on-site

- Provide SAPS with:
  - Incident log (printed from Control Room system)
  - Photo evidence (phone or printed)
  - CCTV footage (if captured breach itself)
  - Witness statements (site manager, any staff)

**Handover Complete When**:
- SAPS has assumed crime scene control
- All evidence documented in SAPS docket
- BlackFire provides contact for statement follow-up
- SAPS investigator has perimeter access

### 4.2 After-Hours Response (No Site Manager on Premises)

#### Phase 1: Defensive Perimeter (0-3 minutes)

**Entry Protocol**:
1. Armed team does NOT enter site immediately
2. Team parks outside perimeter; establish defensive position
3. Radio to Control Room: "On-site, defensive position established, awaiting site manager"
4. Control Room calls site manager (emergency contact list) for access authorization

#### Phase 2: Entry & Assessment (3-10 minutes)

**Once Site Manager Authorizes Entry**:
1. Team enters via agreed gate (with site manager's phone authorization)
2. Conduct cautious perimeter sweep:
   - Check perimeter for breach/intrusion evidence
   - Verify no ongoing unauthorized activity
   - Secure any open gates/doors

3. Report findings to Control Room:
   - "Perimeter breach confirmed at [location]" OR
   - "No evidence of breach; likely false alarm; will investigate cause"

#### Phase 3: SAPS Escalation (If Breach Confirmed)

- Same as daytime protocol (Section 4.1, Phase 2)
- Site manager arrives on-site to secure facility while SAPS investigates

---

## SECTION 5: INCIDENT DOCUMENTATION & REPORTING

### Incident Log Entry (Completed by Armed Response Team)

**Template**:
```
INCIDENT REPORT — AECI CHEMPARK
─────────────────────────────────
Incident ID: [auto-generated by Control Room]
Date: [YYYY-MM-DD]
Time Started: [HH:MM] (alert received)
Time Resolved: [HH:MM] (all-clear given)
Duration: [XX minutes]

Alert Origin:
  □ Fence sensor
  □ Alarm system
  □ CCTV detection
  □ Site manager manual

Location:
  □ North perimeter
  □ South perimeter
  □ East perimeter
  □ West perimeter
  □ [Other: ____________]

Incident Type:
  □ Intrusion attempt
  □ Unauthorized entry
  □ Breach/fence damage
  □ False alarm
  □ System anomaly
  □ [Other: ____________]

Actions Taken:
  ☐ Perimeter secured
  ☐ Site manager notified
  ☐ SAPS contacted (case #: ___________)
  ☐ Evidence documented (photos attached: ☐ Yes ☐ No)
  ☐ Area secured for SAPS investigation

Findings:
  ☐ Genuine threat confirmed
  ☐ False alarm (root cause: _________________)
  ☐ Suspicious activity (details: _________________)
  ☐ No evidence of intrusion

SAPS Involvement:
  ☐ SAPS not required
  ☐ SAPS contacted; case opened (#: ___________)
  ☐ SAPS declined; no docket opened
  ☐ Awaiting SAPS investigation

Follow-Up Required:
  ☐ Fence repair
  ☐ Sensor recalibration
  ☐ System maintenance
  ☐ SAPS statement follow-up
  ☐ No follow-up required

Notes:
[Detailed narrative of incident, timeline, observations, recommendations]

Reporting Officer: ________________  Badge #: _________  
Site Manager Signature: ________________  Date: __________
```

### Monthly Incident Summary Report

**Delivered to**: AECI Site Manager + BlackFire Operations Director  
**Schedule**: 1st business day of each month (covers previous month)

**Contents**:
- Total incidents (broken down by type)
- Response times (average & max)
- False alarm rate & root causes
- Genuine threats detected & outcomes
- System performance metrics
- Recommendations for next month
- Any outstanding investigations (SAPS cases)

---

## SECTION 6: RULES OF ENGAGEMENT (ROE)

### Guiding Principle
**De-escalation First** — Armed response is the last resort, not the first action.

### Use of Force Hierarchy

**Level 1: Presence & Communication**
- ✅ Armed team visible on patrol (deterrent effect)
- ✅ "STOP — Private Security" commands
- ✅ Clear identification (uniform, badge visible)
- ✅ Verbal warning before any physical action

**Level 2: Physical Restraint (if suspect is non-compliant)**
- ✅ Handcuffing/restraining suspect (if lawfully authorized)
- ✅ Holding suspect for SAPS arrival
- ✅ Preventing suspect escape/evidence destruction
- ✅ Protective measures if suspect is armed

**Level 3: Armed Response (if suspect poses immediate threat)**
- ✅ Suspect armed with weapon (gun, knife, etc.)
- ✅ Suspect making aggressive moves toward team/property
- ✅ Suspect attempting to cause serious property damage (fire, explosives)
- ✅ Team safety/AECI personnel safety in immediate jeopardy
- ✅ Warning shots or aimed shots (only as absolute last resort)

**Level 4: Prohibited Actions**
- ❌ Pursuit beyond facility perimeter (SAPS jurisdiction)
- ❌ Searching suspect's person without SAPS authorization
- ❌ Detaining suspect beyond initial handover to SAPS
- ❌ Use of force against non-threatening suspects (even non-compliant)
- ❌ Discharge of weapons for intimidation or warning only

### Weapons Authorization & Safeguards

**Authorized Personnel**:
- All armed response team members carry licensed firearms
- PSIRA registration + annual firearms recertification required
- Weapon: 9mm Glock 19 or equivalent (departmentally assigned)
- Ammunition: Hollow-point rounds (stopping power, reduced over-penetration)

**Weapon Use Documentation**:
- Every shot fired documented in incident report
- SAPS notified immediately
- Ballistics evidence collected & submitted to SAPS
- Internal review of incident within 48 hours

**Off-Duty Protocol**:
- Weapons secured in vehicle safe (not carried off-duty)
- No weapons in residential areas (illegal in RSA)
- Personal firearm use strictly off-limits during work

---

## SECTION 7: SAPS COORDINATION & LEGAL COMPLIANCE

### SAPS Liaison Information

**Primary Contact** (Modderfontein SAPS Station):
- Station Commander: [Name & Phone]
- Community Policing Officer: [Name & Phone]
- Emergency Dispatch: [Phone / WhatsApp]
- Non-Emergency Report Line: [Phone]

**Incident Reporting Protocol**:
1. BlackFire Control Room notifies SAPS within 5 minutes of credible threat confirmation
2. Incident details provided:
   - Exact location (address + GPS if possible)
   - Nature of threat (intrusion, theft, vandalism, etc.)
   - Suspect description (if visible via CCTV)
   - Evidence presence (tools, weapons, damage)
3. SAPS case number recorded in incident log
4. BlackFire team makes statements available for investigation

### Legal Framework (South Africa)

**Relevant Legislation**:
- **Private Security Industry Regulation Act** (PSIRA): Governs armed response personnel licensing
- **Criminal Procedure Act**: Rules for citizen apprehension, handcuffing, detention
- **Property Protection Laws**: What force is "reasonably justified" for property defense
- **Firearm Control Act**: Ammunition, licensing, discharge regulations

**Key Legal Points**:
- ✅ Private security may detain suspects for SAPS handover (10-15 minutes maximum)
- ✅ Reasonable force justified to prevent property theft/damage
- ✅ Armed response must not exceed SAPS authority
- ✅ All firearm discharges must be reported to SAPS within 24 hours
- ❌ Private security may NOT arrest suspects (only SAPS can arrest)
- ❌ Torture or excessive force is criminal liability (personal + company)

### Liability & Insurance

**Professional Indemnity Coverage**:
- Policy Holder: BlackFire Solutions
- Coverage Limit: R2,000,000 per incident
- Coverage Includes:
  - Armed response personnel errors/negligence
  - Property damage caused by response team
  - Personnel injury (third-party claims)
  - False imprisonment / wrongful detention claims

**Client Indemnification**:
- AECI held harmless from BlackFire actions (standard contract clause)
- Insurance covers claims arising from response operations
- Client liability limited to gross negligence/unauthorized actions

---

## SECTION 8: TEAM COMPETENCIES & TRAINING

### Annual Training Schedule

**Q1 — Tactical Response Drills**
- Simulated intrusion scenarios (various complexity)
- ROE decision-making exercises
- SAPS coordination scenarios
- Weapons discharge safety refresher

**Q2 — Legal & Compliance**
- Property protection law updates
- PSIRA compliance review
- Incident documentation procedures
- Privacy & POPIA refresher

**Q3 — Medical & First Aid**
- Emergency trauma response training
- CPR certification renewal
- Burn/chemical exposure protocols (site-specific for AECI)
- Evacuation procedures

**Q4 — Strategic Review**
- Annual performance evaluation
- Incident trend analysis
- Threat assessment update
- Contract renewal discussion

### Personnel Requirements

**Minimum Qualifications**:
- PSIRA Grade B (armed response) registration
- Valid firearms license + ammunition competency
- First aid certificate (ST John or equivalent)
- Criminal record clearance (no disqualifying convictions)
- Valid driver's license (professional driving)

**Ongoing Compliance**:
- PSIRA registration renewed annually
- Firearms license & ammunition competency renewed annually
- Medical check-up (annual fitness assessment)
- Psychological evaluation (every 2 years)
- Background check refresh (every 3 years)

---

## SECTION 9: COMMUNICATIONS & ESCALATION

### Radio Protocol

**Frequency**: [Specify: VHF/UHF frequency or encrypted radio system]  
**Code Language**: Plain English (no codes; clarity essential for emergency response)

**Sample Radio Communications**:
```
Control Room: "BlackFire Tactical, this is Control Room Control. Alert received: Fence breach, east perimeter, sustained signal. Dispatch authorized. Site manager not present. Entry via side gate authorized. SAPS on standby."

TEAM: "Copy, Control Room. BlackFire Tactical en route. ETA 6 minutes. Vehicle registration [XX]. Will call on arrival."

[5 minutes later]

TEAM: "Control Room, BlackFire Tactical on-site, defensive position established. Awaiting site manager arrival for entry authorization."

Control Room: "Copy. Site manager called; ETA 10 minutes. Stand by."

[10 minutes]

TEAM: "Control Room, site manager arrived, entry authorized. Proceeding to perimeter. Will update in 2 minutes."

[2 minutes]

TEAM: "Control Room, perimeter breach confirmed. East fence, 1.5m hole, fresh. Tools on ground indicate active work. Suspected intruder fled. Securing area for SAPS."

Control Room: "Copy. SAPS dispatch already initiated. ETA 20 minutes. Continue securing."
```

### Escalation Chain

**Tier 1 (Alert)** → Control Room Technician  
**Tier 2 (Dispatch Authorization)** → Control Room Manager  
**Tier 3 (SAPS Involvement)** → BlackFire Operations Director + AECI Site Manager  
**Tier 4 (Media / Major Incident)** → BlackFire CEO + AECI Executive  

---

## SECTION 10: EQUIPMENT & VEHICLE SPECIFICATIONS

### Armed Response Vehicle

**Vehicle Type**: Unmarked sedan or SUV (rapid mobility, low profile)  
**Radio**: Encrypted digital radio system (BlackFire network)  
**GPS**: Real-time tracking (Control Room can monitor team position)  
**CCTV**: Optional (can record patrol activity for evidence)  
**Weapons Safe**: Locked, accessible only to authorized personnel  
**First Aid Kit**: Full trauma kit (bandages, tourniquets, gauze, etc.)  
**Tools**: Flashlights, rope, binoculars, gate-opening equipment  

### Personal Equipment (Per Officer)

- PSIRA badge + identification
- Firearm (Glock 19, 9mm) + holster
- Ammunition (hollow-point rounds, minimum 2 mags)
- Handcuffs + keys
- Flashlight (rechargeable LED)
- Body camera (optional, for evidence documentation)
- First aid kit (personal)
- Communication radio + earpiece

---

## SECTION 11: SITE-SPECIFIC PROTOCOLS

### Public Perimeter Response Protocol

Sections of AECI Chempark's boundary border public or open land. These zones present a distinct threat category managed primarily by drone, with guard response only on drone-confirmed events.

#### Informal Occupation / Encroachment

**Detection**: Drone during scheduled public perimeter sweep (minimum 2x per week)

**Response Procedure**:
1. Drone operator identifies informal occupation, structures, or presence in boundary vegetation
2. Control Room logs with aerial footage (timestamped, GPS-located)
3. Control Room notifies AECI site manager (footage attached to notification)
4. AECI site manager determines response: SAPS referral, legal notice, or internal response team
5. Drone continues monitoring the area; documents before/during/after any response
6. Subsequent sweeps confirm area is clear

**Note**: Guards do NOT approach informal occupants without SAPS or explicit AECI management instruction. The drone provides evidence and monitoring; human response is determined by AECI management.

---

#### Fire on Adjacent Public Land

**Detection**: Guard observation or smoke detection; drone deployed immediately

**Response Procedure**:
1. Guard or Control Room identifies smoke/fire near boundary; Control Room logs alert
2. Drone deployed immediately to assess:
   - Fire extent (approximate area in metres)
   - Wind direction and spread trajectory
   - Distance from AECI perimeter fence
   - Any AECI assets directly threatened
3. Control Room contacts fire department with aerial intelligence:
   - Fire location (GPS coordinates from drone)
   - Approximate size and spread direction
   - Recommended access route
   - Whether AECI fence is at risk
4. Drone continues monitoring; Control Room updates fire department on spread in real-time
5. If fire reaches perimeter fence: Control Room escalates to AECI site manager immediately
6. Drone documents full event from detection to containment for insurance and AECI records

**Fire Department Contact**: See Section 12 Contact Directory

**AECI Chemical Safety Note**: If fire threatens chemical storage proximity, follow Chemical Safety Protocol (Section 11) and alert AECI Safety Officer immediately.

---

### AECI Chempark Unique Considerations

#### Chemical Safety
- **Hazardous Materials Present**: [Specify: chemicals stored on-site]
- **Protocol**: Do NOT enter chemical storage areas without AECI safety officer escort
- **Evacuation Route**: [Specify: safe assembly point in case of chemical release]
- **Emergency Contact**: AECI Safety Officer [Phone]

#### Shift & Access Patterns
- **Day Shift**: [Hours] — Site manager always present
- **Night Shift**: [Hours] — Skeleton staff; emergency protocols apply
- **Weekends**: [Hours] — Minimal staff; enhanced response caution
- **Maintenance Windows**: [Days/Times] — Authorized activity (coordinate with Control Room)

#### Suspect Detention Areas
- **Holding Point**: [Specify: secure room or office]
- **Restraint Equipment**: [Specify: handcuffs, zip-ties, or facility holding cells]
- **SAPS Handover Point**: [Specify: location where SAPS assumes custody]

---

## SECTION 12: CONTACT DIRECTORY

### BlackFire Solutions Contacts

| Role | Name | Phone | Email | Availability |
|------|------|-------|-------|---|
| Operations Director | [Name] | [Phone] | [Email] | 24/7 |
| Control Room Manager | [Name] | [Phone] | [Email] | 24/7 |
| Tactical Lead | [Name] | [Phone] | [Email] | On-duty |
| Backup Tactical | [Name] | [Phone] | [Email] | On-duty |

### AECI Chempark Contacts

| Role | Name | Phone | Email | Availability |
|------|------|-------|-------|---|
| Site Manager | [Name] | [Phone] | [Email] | Daily 06:00-18:00 |
| Safety Officer | [Name] | [Phone] | [Email] | Daily 06:00-18:00 |
| Emergency Contact | [Name] | [Phone] | [Email] | 24/7 |
| Executive (Approvals) | [Name] | [Phone] | [Email] | Business hours |

### Emergency Services (Modderfontein Area)

| Service | Phone | Notes |
|---------|-------|-------|
| SAPS Emergency | 10177 | 24/7 |
| Modderfontein SAPS Station | [Phone] | 5-10 min response |
| Ambulance Emergency | 10177 | Coordinate with SAPS |
| Fire Department | [Phone] | Chemical fire protocol required |
| Hospital (Nearest) | [Name, Phone] | [Distance, ETA] |

---

## APPENDICES

### Appendix A: Incident Response Flowchart
*[Visual diagram of decision tree for different alert scenarios]*

### Appendix B: Site Maps & Entry Points
*[Detailed maps showing perimeter, gates, alarm zones, facility layout]*

### Appendix C: PSIRA Certification Copies
*[All team member registrations & firearms licenses]*

### Appendix D: Insurance Certificate
*[Professional indemnity coverage details & limits]*

### Appendix E: SAPS Coordination Procedures
*[Detailed protocol for SAPS case file submission & evidence handling]*

### Appendix F: Chemical Safety Data
*[SDS sheets for chemicals on-site; emergency exposure protocols]*

---

**Document Version**: 1.0  
**Effective Date**: [Date]  
**Last Updated**: [Date]  
**Next Review**: [Date + 12 months]  

**Document Authority**: BlackFire Operations Director  
**Client Approval**: AECI Site Manager  

**© 2026 BlackFire Solutions. Confidential — Authorized Personnel Only.**

