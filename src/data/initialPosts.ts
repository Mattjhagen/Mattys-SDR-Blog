import { BlogPost, SolarBandCondition, ClubNetInfo } from '../types/blog';

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'noaa-19-apt-meteor-lrpt-rtl-sdr-qfh',
    title: 'Capturing NOAA-19 APT & Meteor-M2 LRPT with RTL-SDR v4 & Homebrew QFH Antenna',
    excerpt: 'Step-by-step notes on pulling crisp 137 MHz weather satellite imagery directly from low Earth orbit using a DIY copper wire quadrifilar helix antenna, SAWbird LNA, and SatDump.',
    authorCallsign: 'W7SDR',
    authorName: 'Matt Hagen',
    authorQth: 'Puget Sound, WA',
    publishedAt: '2026-10-02',
    readTimeMinutes: 7,
    category: 'Satellites & Space',
    band: '137 MHz (VHF)',
    frequencyHz: 137100000,
    qthGrid: 'CN87us',
    rigEquipment: 'RTL-SDR Blog v4 · Nooelec SAWbird+ NOAA · DIY QFH Antenna',
    coverImage: '/src/assets/images/article_noaa_apt_1791391179875.jpg',
    tags: ['SDR', 'NOAA', 'Satellites', 'Antenna Build', 'VHF', 'SatDump'],
    featured: true,
    qsoCount: 4,
    likes: 24,
    comments: [
      {
        id: 'c-1',
        callsign: 'K7NVH',
        name: 'Dave Henderson',
        timestamp: '2026-10-02 18:40',
        message: 'Great pass decode Matt! Are you running the bias-tee powered directly off the v4 dongle or external 5V injection?',
        rstReport: '59'
      },
      {
        id: 'c-2',
        callsign: 'W7SDR',
        name: 'Matt Hagen',
        timestamp: '2026-10-02 19:15',
        message: 'Thanks Dave! The RTL-SDR v4 internal bias tee (4.5V) drives the SAWbird with zero issues. Saved running a separate DC feedline up to the mast.',
        rstReport: '599'
      },
      {
        id: 'c-3',
        callsign: 'N7DX',
        name: 'Greg Larson',
        timestamp: '2026-10-03 08:22',
        message: 'We should demonstrate this at the next club meeting show-and-tell. The resolution on that coastal front is remarkable.',
        rstReport: '59'
      }
    ],
    content: `## Mission Background & Satellite Orbit
For any club member looking to get hands-on with VHF SDR receiving, polar-orbiting weather satellites remain one of the most rewarding targets. Unlike distant GEO satellites that require dish tracking, NOAA-15, NOAA-18, NOAA-19, and the Russian Meteor-M2-3/4 pass overhead at 820 km altitude in Sun-synchronous orbits twice daily per bird.

During their 12-to-15-minute passes, they broadcast live infrared and visible sensor telemetry. With a modest circular polarization antenna and an entry-level SDR, you can decode raw sensor matrices showing cold fronts, maritime fog, and mountain snowpack across thousands of miles.

---

### Hardware Configuration
Here is the exact signal chain utilized for this weekend's capture from my deck in grid **CN87us**:

- **Receiver**: RTL-SDR Blog v4 (R828D tuner + upconverter architecture)
- **Preamp / Filter**: Nooelec SAWbird+ NOAA (dual high-gain LNA with ceramic 137 MHz bandpass filter)
- **Antenna**: Homebrew Quadrifilar Helix (QFH) constructed from 12 AWG bare copper ground wire inside a 1.5-inch PVC pipe frame
- **Coax**: 15 ft of Times Microwave LMR-240 with soldered SMA male connectors
- **Software**: SDR++ (v1.2.0) with automated pipeline into SatDump (v1.1.4)

\`\`\`
[QFH Antenna (137 MHz RHCP)]
       │
       ▼ (LMR-240 Low Loss)
[SAWbird+ NOAA LNA (30dB Gain / 0.8dB NF)]
       │ (Bias-Tee 4.5V from dongle)
       ▼
[RTL-SDR Blog v4 Receiver]
       │ (USB 2.0)
[Laptop: SDR++ Baseband IQ recording -> SatDump Offline Pipeline]
\`\`\`

---

### Antenna Build Notes: The Quadrifilar Helix
Why not a simple 1/4 wave ground plane or horizontal dipole? Polar weather satellites transmit **Right-Hand Circular Polarization (RHCP)**. As the satellite sweeps across your horizon and zenith, linear antennas suffer severe periodic Faraday rotation fades (nulls of 20 dB or more), producing striped horizontal dropouts across the decoded picture.

A QFH antenna provides hemispherical RHCP coverage with high elevation gain and excellent rejection of ground-level multipath noise.

**Key Dimensions for 137.5 MHz Center:**
1. Large loop wire length: **1148 mm**
2. Small loop wire length: **1068 mm**
3. PVC outer diameter: **38 mm (1.5" schedule 40)**
4. Matching network: Simple 50-ohm RG-316 balun coil (4 turns, 25 mm diameter) right at the top terminals

> **Builder Tip**: Weatherproof the top terminal block thoroughly with silicone conformal coating and vulcanizing tape. Morning condensation will quickly detune the loop resonance if moisture bridges the phase junction!

---

### Live Capture & Doppler Correction Log
During NOAA-19 pass #74812 (Max Elevation: 68° Azimuth: 194° to 012°):

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Center Frequency** | 137.100 MHz | Nominally shifted +/- 3.2 kHz Doppler |
| **IF Bandwidth** | 40 kHz | FM demodulated passband |
| **RF Gain** | 28.0 dB | Optimal SNR before intermodulation |
| **Peak SNR** | 31.5 dB | Measured at zenith elevation |
| **Decoded Resolution** | 4 km / pixel | AVHRR Channel 2 (Visible) & Channel 4 (Thermal IR) |

The resulting image resolved the cold front moving off Vancouver Island with astounding clarity. Even the snow-capped summits of the Cascade Range were clearly visible against the Puget Sound basin.

If anyone in the club wants the 3D-printable drilling jig template for the PVC QFH frame, drop a reply below and I'll bring several to Thursday's club net!
`
  },
  {
    id: 'post-2',
    slug: 'qrp-pota-activation-mount-rainier-foothills-kx2',
    title: 'QRP POTA Activation at Mount Rainier Foothills: 5 Watts on 20m & 40m CW',
    excerpt: 'Field report from activating K-4392 with 5 watts into a 41ft random wire thrown 35ft up into a Douglas fir. 48 QSOs in 90 minutes including DX into Japan and Spain.',
    authorCallsign: 'W7SDR',
    authorName: 'Matt Hagen',
    authorQth: 'Pierce County, WA',
    publishedAt: '2026-09-24',
    readTimeMinutes: 5,
    category: 'HF & DX Field',
    band: '20m & 40m CW',
    frequencyHz: 14060000,
    qthGrid: 'CN86xx',
    rigEquipment: 'Elecraft KX2 (5W) · 41ft Random Wire + 9:1 Unun · Bioenno 3Ah LiFePO4',
    coverImage: '/src/assets/images/article_qrp_pota_1791391169211.jpg',
    tags: ['POTA', 'QRP', 'CW', 'Field Operations', 'Portable', 'HF'],
    featured: false,
    qsoCount: 48,
    likes: 38,
    comments: [
      {
        id: 'c-4',
        callsign: 'K7GDB',
        name: 'George Baker',
        timestamp: '2026-09-24 21:05',
        message: 'Heard your 5W signal down here in Oregon Matt! Solid 579 on 7.032 MHz. Thanks for the park multiplier!',
        rstReport: '579'
      },
      {
        id: 'c-5',
        callsign: 'JH1ECG',
        name: 'Kenji Sato',
        timestamp: '2026-09-25 03:10',
        message: 'Arigato for QSO on 14.062! Loud 559 in Tokyo with your 5 watts. QSL via LoTW sent.',
        rstReport: '559'
      }
    ],
    content: `## Into the Woods: Activating Park K-4392
Nothing resets the radio operator soul like packing an entire HF station into a 15-liter daypack, hiking two miles off the logging road, and operating with a zero-noise floor (S-0 background noise!).

Last Sunday I took the Elecraft KX2 up to a ridge overlook in the Mount Rainier foothills. Away from suburban switching power supplies, solar inverters, and LED hash, the 20-meter band sounded alive in a way that is simply impossible from my suburban home QTH.

---

### The Field Kit Breakdown
Keeping pack weight under 4.5 lbs (2 kg) allows for brisk hiking:

1. **Transceiver**: Elecraft KX2 with internal ATU (running strictly 5 watts output)
2. **Paddles**: BaMaTech TP-III precision magnetic CW paddle (clamped to the KX2 leg)
3. **Power**: Bioenno 12V 3Ah LiFePO4 battery (yielded over 4 hours of CW operating time with plenty to spare)
4. **Antenna**: 41-foot 22 AWG Poly-STEALTH stranded wire + 17-foot counterpoise wire on the ground
5. **Matching**: Homebrew 9:1 Unun wound on a FT140-43 ferrite toroid in a Tic-Tac box
6. **Deployment**: 10 oz arborist throw weight + 150 ft slick Zing-It 1.75mm dyneema line

\`\`\`
Tree Branch (35 ft)
        ▲
        │  41 ft Poly-STEALTH Wire (sloper / inverted-L)
        │ 
        │
   [ 9:1 Unun ] ── 15 ft BNC RG-316 ──> [ KX2 Internal ATU ]
        │
        └── 17 ft Counterpoise on forest floor
\`\`\`

---

### Selected QSO Log Highlights (48 Total Contacts)
The pileup opened immediately on 14.060 MHz after spotting on pota.app:

| Time (UTC) | Callsign | Band | Mode | Sent | Received | QTH / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **19:14** | **W7HAM** | 20m | CW | 599 | 599 | Club member Bill checking in! |
| **19:28** | **K0MOS** | 20m | CW | 579 | 559 | Colorado Rocky Mtns |
| **19:42** | **EA4TX** | 20m | CW | 559 | 549 | Madrid, Spain (Transatlantic 5W!) |
| **20:05** | **JH1ECG** | 20m | CW | 559 | 559 | Tokyo, Japan (Greyline opening) |
| **20:25** | **VE7SAR** | 40m | CW | 599 | 599 | Vancouver BC (Switched to 40m) |
| **20:41** | **K7GDB** | 40m | CW | 579 | 589 | Portland OR P2P Hunter |

### Lessons Learned
- **Counterpoise tuning**: On high-impedance forest duff, a single counterpoise wire elevated 6 inches on wood sticks dropped SWR on 40m from 2.8:1 down to 1.3:1 before the internal tuner even engaged.
- **Sun protection for screens**: The monochrome LCD on modern transceivers washes out in direct mountain sunlight; packing a baseball cap or small clip-on sunshade makes reading the log and S-meter effortless.
`
  },
  {
    id: 'post-3',
    slug: 'high-q-backyard-magnetic-loop-antenna-build',
    title: 'Designing a High-Q Backyard Magnetic Loop for 40m–20m Stealth Operating',
    excerpt: 'How I built a 1-meter diameter copper pipe magnetic loop with a Russian vacuum variable capacitor and remote stepper tuning for whisper-quiet HF reception in an HOA.',
    authorCallsign: 'W7SDR',
    authorName: 'Matt Hagen',
    authorQth: 'Puget Sound, WA',
    publishedAt: '2026-09-15',
    readTimeMinutes: 8,
    category: 'Antenna Builds',
    band: '40m through 20m',
    frequencyHz: 7150000,
    qthGrid: 'CN87us',
    rigEquipment: '1m Copper Loop · Vacuum Variable 10-500pF · ESP32 Stepper Controller',
    coverImage: '/src/assets/images/article_hf_magloop_1791391189393.jpg',
    tags: ['Antennas', 'Magnetic Loop', 'HOA Stealth', 'NanoVNA', 'Homebrew', '40m', '20m'],
    featured: false,
    qsoCount: 12,
    likes: 41,
    comments: [
      {
        id: 'c-6',
        callsign: 'W7ARC',
        name: 'Steve Miller',
        timestamp: '2026-09-15 16:30',
        message: 'Where did you source that vacuum variable capacitor Matt? Looking to duplicate this for our winter 40m ragchew net.',
        rstReport: '59'
      },
      {
        id: 'c-7',
        callsign: 'W7SDR',
        name: 'Matt Hagen',
        timestamp: '2026-09-15 17:10',
        message: 'Steve - I got the KP1-4 10-500pF 5kV unit surplus from an eBay seller in Lithuania. The low contact resistance of copper flanges is essential.',
        rstReport: '599'
      }
    ],
    content: `## The HOA Conundrum & The Small Transmitting Loop
Like many club members in newer subdivisions, my neighborhood has strict CC&R restrictions forbidding towers, visible dipoles, or long wire radials. For months I struggled with an indoor attic dipole that picked up every LED transformer and plasma TV in a 200-meter radius.

The solution? A **Small Transmitting Magnetic Loop (STML)**. Because magnetic loops respond primarily to the magnetic component ($H$-field) of the electromagnetic wave rather than the electric ($E$-field), they reject common-mode near-field electrostatic noise from household appliances with surgical precision.

---

### Mathematical Specifications
For a loop with **Diameter = 1.0 m** built from **28 mm (1-inch) rigid refrigeration copper tubing**:

- **Circumference**: 3.14 m ($0.075\\lambda$ at 7.1 MHz, $0.147\\lambda$ at 14.1 MHz)
- **Radiation Resistance ($R_r$) at 7.1 MHz**: $\\approx 0.045\\ \\Omega$
- **Loss Resistance ($R_l$)**: $\\approx 0.038\\ \\Omega$
- **Total Efficiency**: $\\approx 54\\%$ on 20m, $\\approx 14\\%$ on 40m
- **Loaded Q-Factor**: $\\approx 820$ on 40m (Bandwidth $\\Delta f \\approx 8.6$ kHz!)

> **Crucial Warning: RF High Voltage**: With a Q-factor over 800, even a conservative 50 watts of input power creates **over 3,500 Volts peak** across the capacitor plates! Standard air variable capacitors from old broadcast radios will arc immediately. A high-voltage **vacuum variable capacitor** is mandatory.

---

### Remote Tuning with Stepper & NanoVNA
Because the 3dB bandwidth on 40m is narrower than 10 kHz, retuning every time you shift frequency is required.

I mounted a NEMA-17 planetary gearbox stepper motor (5:1 reduction) directly to the ceramic shaft of the KP1-4 capacitor. An ESP32 microcontroller inside the weather enclosure drives an A4988 motor driver, communicating over a lightweight 4-conductor shielded control line back into the shack.

\`\`\`
[Shack Rotary Dial / NanoVNA Sweep]
            │
            ▼ (Pulse / Direction Steps)
[ESP32 Controller + A4988 Driver]
            │
            ▼ (Coupled Flexible Shaft)
[Russian KP1-4 Vacuum Variable Capacitor (10-500 pF, 5kV Rating)]
            │
[1-meter Solid Copper Loop (Silver-Soldered Joints)]
\`\`\`

### Real-World Operating Results
- **Noise floor reduction**: On 40m, band noise dropped from S-8 down to **S-2**. Stations that were previously buried in broadband hum became 100% copyable.
- **Deep Nulling**: By rotating the loop with a small TV antenna rotator, I can place the loop's 30dB edge null directly towards my neighbor's noisy pool pump inverter, eliminating the interference completely.
`
  },
  {
    id: 'post-4',
    slug: 'setting-up-club-openwebrx-kiwisdr-remote-hf-station',
    title: 'Setting Up an SDR Web Receiver (OpenWebRX & KiwiSDR) for the Club Shack',
    excerpt: 'Detailed architecture on how we installed a remote WebSDR receiver at our club repeater site so all members can listen to clear HF, 6m, and 2m bands from any web browser or tablet.',
    authorCallsign: 'W7SDR',
    authorName: 'Matt Hagen',
    authorQth: 'Puget Sound, WA',
    publishedAt: '2026-09-08',
    readTimeMinutes: 6,
    category: 'SDR & DSP',
    band: 'HF through VHF (100 kHz - 150 MHz)',
    frequencyHz: 14200000,
    qthGrid: 'CN87us',
    rigEquipment: 'Airspy HF+ Discovery · Raspberry Pi 4 (4GB) · Mini-Whip Active Antenna',
    coverImage: '/src/assets/images/hero_ham_shack_1791391157714.jpg',
    tags: ['OpenWebRX', 'WebSDR', 'Club Project', 'Airspy', 'Digital DSP', 'Raspberry Pi'],
    featured: false,
    qsoCount: 0,
    likes: 31,
    comments: [
      {
        id: 'c-8',
        callsign: 'KD7ZAB',
        name: 'Rachel Vance',
        timestamp: '2026-09-08 20:12',
        message: 'This has been incredible for checking my own transmitted signal audio from my mobile rig! Thank you for setting up the OpenWebRX container.',
        rstReport: '599'
      }
    ],
    content: `## A Shared Ear on the Mountain
One of the best collective projects a ham radio club can undertake is a community WebSDR receiver. Many new licensees live in apartment buildings or urban centers where high electrical noise floors discourage HF operating.

Last month the technical committee installed a dedicated **OpenWebRX+** node at our repeater shack on Tiger Mountain (elevation 1,800 ft), featuring panoramic views, commercial grounding, and virtually non-existent man-made noise.

---

### System Architecture
The node supports up to 8 simultaneous web listeners with real-time waterfall streaming and digital decoding (FT8, JT65, WSPR, CW, and APRS) handled server-side:

- **SDR Frontend**: Airspy HF+ Discovery (outstanding 18-bit dynamic range, zero intermod)
- **Host System**: Raspberry Pi 4 Model B (4 GB RAM) booted from a reliable 120 GB Kingston SSD
- **Antenna**: PA0RDT active Mini-Whip mounted 15 ft above the repeater building roofline on a non-conductive fiberglass mast
- **Network**: Ubiquiti 5 GHz microwave point-to-point link back to the valley internet backbone

\`\`\`
[PA0RDT Mini-Whip Antenna]
            │
            ▼ (Isolated Coax with Common Mode Choke)
[Bias-Tee 12V Regulated DC Feed]
            │
            ▼ (SMA)
[Airspy HF+ Discovery SDR (18-bit ADC)]
            │ (USB 2.0)
[Raspberry Pi 4 ─ OpenWebRX+ Docker Engine]
            │
            ▼ (WebSocket WebRTC Audio / Canvas FFT)
[Club Web Browsers & Mobile Phones (Up to 8 concurrent listeners)]
\`\`\`

---

### Built-in Club Features
1. **Bookmark Presets**: Direct links to our weekly 10m ragchew (28.400 MHz USB), club 6m calling (50.125 MHz), and FT8 frequencies.
2. **Built-in Audio Recording**: Members can click the record button to capture their own signal audio for antenna comparisons or audio equalization checks.
3. **Automated WSPR beacon spotter**: The node automatically uploads 24/7 propagation reports to WSPRnet, tracking band openings for the entire regional ham community.
`
  }
];

export const SOLAR_CONDITIONS: SolarBandCondition[] = [
  { band: '80m', mhz: '3.5 - 4.0 MHz', day: 'Poor', night: 'Good' },
  { band: '40m', mhz: '7.0 - 7.3 MHz', day: 'Fair', night: 'Good' },
  { band: '30m', mhz: '10.1 - 10.15 MHz', day: 'Good', night: 'Good' },
  { band: '20m', mhz: '14.0 - 14.35 MHz', day: 'Good', night: 'Fair' },
  { band: '17m', mhz: '18.068 - 18.168 MHz', day: 'Good', night: 'Poor' },
  { band: '15m', mhz: '21.0 - 21.45 MHz', day: 'Good', night: 'Poor' },
  { band: '10m', mhz: '28.0 - 29.7 MHz', day: 'Fair', night: 'Poor' },
  { band: '6m', mhz: '50.0 - 54.0 MHz', day: 'Fair', night: 'Poor' }
];

export const CLUB_NETS: ClubNetInfo[] = [
  {
    name: 'Valley ARC Weekly 2m Check-in Net',
    dayOfWeek: 'Every Thursday',
    timeLocal: '19:30 Local (02:30 UTC)',
    frequency: '146.880 MHz',
    offset: '-0.600 MHz',
    tone: 'CTCSS 103.5 Hz',
    mode: 'FM Analog',
    netControlCall: 'K7NVH',
    echolinkNode: 'W7HRC-R (#49281)',
    description: 'Weekly club updates, swap & shop, equipment troubleshooting, and open visitor check-ins.'
  },
  {
    name: 'Sunday Evening 10m Tech Ragchew',
    dayOfWeek: 'Every Sunday',
    timeLocal: '20:00 Local (03:00 UTC)',
    frequency: '28.420 MHz',
    offset: 'Simplex',
    tone: 'None',
    mode: 'USB',
    netControlCall: 'W7SDR',
    description: 'Casual roundtable discussion focused on SDR projects, homebrew wire antennas, and digital mode experiments.'
  },
  {
    name: 'Emergency ARES / RACES Preparedness Net',
    dayOfWeek: '1st & 3rd Tuesday',
    timeLocal: '19:00 Local (02:00 UTC)',
    frequency: '443.250 MHz',
    offset: '+5.000 MHz',
    tone: 'CTCSS 114.8 Hz',
    mode: 'FM & Yaesu System Fusion (C4FM)',
    netControlCall: 'N7DX',
    description: 'Emergency communications readiness, Winlink packet checks, and auxiliary power drills.'
  }
];
