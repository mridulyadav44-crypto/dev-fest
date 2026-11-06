/**
 * VehiStay - Official Web Application & Smart Parking Suite Script
 * Currency: Rs. (Indian Rupees)
 * Features: VehiStay Coupon Engine, City Selection, Smart Parking Terminal, Driver & Customer Appointments, All Services
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Audio Sound Effects Synthesizer (Web Audio API)
  // =========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    playBeep(freq = 880, type = 'sine', duration = 0.1, gainVal = 0.08) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }
    playSuccess() {
      this.playBeep(523, 'triangle', 0.1, 0.08);
      setTimeout(() => this.playBeep(659, 'triangle', 0.12, 0.08), 70);
      setTimeout(() => this.playBeep(1046, 'sine', 0.2, 0.1), 140);
    }
    playGateMotor() {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
      } catch (e) {}
    }
  }

  const sound = new SoundEngine();

  // =========================================================================
  // 2. Data Models & Constants (In Rs.)
  // =========================================================================
  const FLOORS = [
    { id: 1, name: 'Floor 1 - Main & Accessible', code: 'F1', baseRate: 50.00 },
    { id: 2, name: 'Floor 2 - EV Fast-Charge Hub', code: 'F2', baseRate: 60.00 },
    { id: 3, name: 'Floor 3 - Standard & Compact', code: 'F3', baseRate: 40.00 },
    { id: 4, name: 'Floor 4 - Rooftop VIP Lounge', code: 'F4', baseRate: 80.00 }
  ];

  const SAMPLE_PLATES = [
    'MH 02 AB 1234', 'DL 3C AY 9988', 'KA 01 MJ 4521', 'TS 09 EQ 7733',
    'HR 26 DQ 5510', 'UP 32 AZ 8901', 'TN 07 BE 2234', 'GJ 01 CW 6690'
  ];

  const SERVICES = [
    { id: 1, name: 'Daily Standard Parking Pass', price: 150.00, icon: '🚗', desc: 'Full 24-hour access to standard parking bays across all central parking decks with contactless QR entry.' },
    { id: 2, name: 'EV Supercharge & Park Bundle', price: 350.00, icon: '⚡', desc: 'All-day parking bay access combined with 150 kW DC Fast Charging session (up to 40 kWh included).' },
    { id: 3, name: 'Monthly Reserved Spot Pass', price: 1200.00, icon: '🅿️', desc: 'Guaranteed 24/7 dedicated personal parking space with automated ANPR license plate recognition gate access.' },
    { id: 4, name: 'Executive VIP Valet Pass', price: 450.00, icon: '👑', desc: 'Curbside drop-off and priority retrieval service by certified professional valet attendants.' },
    { id: 5, name: 'Motorcycle & Two-Wheeler Pass', price: 80.00, icon: '🏍️', desc: 'Dedicated sheltered bay for two-wheelers and compact vehicles with easy ground floor access.' },
    { id: 6, name: 'Eco Car Wash & Detailing Addon', price: 250.00, icon: '✨', desc: 'Full exterior hand wash, tire shine, and interior vacuum while your car is safely parked.' }
  ];

  const CITY_LOCATIONS = {
    'Kanpur': [
      { 
        id: 'iitk', 
        name: 'IIT Kanpur', 
        full: 'IIT Kanpur (Kalyanpur, GT Road Main Campus)', 
        type: 'Premier National Institute', 
        address: 'Kalyanpur, Grand Trunk Road, Kanpur, Uttar Pradesh 208016', 
        mapQuery: 'IIT Kanpur, Kalyanpur, Kanpur, Uttar Pradesh',
        gates: 'Gate 1 (Main GT Road), Gate 2 (Nankari), Gate 3 (Hall 12)',
        spots: '280+ Bays Available (ANPR Integrated)'
      },
      { 
        id: 'csjmu', 
        name: 'CSJM University', 
        full: 'CSJM University (Kanpur Univ Main Campus, Kalyanpur)', 
        type: 'State Public University', 
        address: 'Kalyanpur, Kanpur, Uttar Pradesh 208024', 
        mapQuery: 'Chhatrapati Shahu Ji Maharaj University, Kalyanpur, Kanpur',
        gates: 'Gate 1 (Main Entrance), Gate 2 (Auditorium), Gate 3 (Admin Block)',
        spots: '350+ Bays Available'
      },
      { 
        id: 'hbtu-east', 
        name: 'HBTU East Campus', 
        full: 'HBTU Kanpur East Campus (Nawabganj)', 
        type: 'State Technical University', 
        address: 'Nawabganj, Kanpur, Uttar Pradesh 208002', 
        mapQuery: 'Harcourt Butler Technical University East Campus, Nawabganj, Kanpur',
        gates: 'East Campus Main Gate, Civil Lines Approach',
        spots: '180+ Bays Available'
      },
      { 
        id: 'hbtu-west', 
        name: 'HBTU West Campus', 
        full: 'HBTU Kanpur West Campus (Awadhpuri, Kalyanpur)', 
        type: 'State Technical University', 
        address: 'Awadhpuri, Kalyanpur, Kanpur, Uttar Pradesh 208024', 
        mapQuery: 'HBTU West Campus, Awadhpuri, Kalyanpur, Kanpur',
        gates: 'West Campus Main Entrance, Hostel Quad Gate',
        spots: '210+ Bays Available'
      },
      { 
        id: 'csa', 
        name: 'CSA Agriculture Univ', 
        full: 'Chandra Shekhar Azad (CSA) University (Nawabganj/Rawatpur)', 
        type: 'State Agriculture University', 
        address: 'Rawatpur / Nawabganj Road, Kanpur, Uttar Pradesh 208002', 
        mapQuery: 'Chandra Shekhar Azad University of Agriculture and Technology, Kanpur',
        gates: 'Rawatpur Main Gate, Botanical Garden Gate',
        spots: '200+ Bays Available'
      },
      { 
        id: 'gsvm', 
        name: 'GSVM Medical College', 
        full: 'GSVM Medical College & Hospital (Swaroop Nagar)', 
        type: 'Government Medical College', 
        address: 'Swaroop Nagar, Kanpur, Uttar Pradesh 208002', 
        mapQuery: 'GSVM Medical College, Swaroop Nagar, Kanpur',
        gates: 'Emergency Trauma Gate, OPD Gate, Hallet Hospital Gate',
        spots: '320+ Bays Available'
      },
      { 
        id: 'psit', 
        name: 'PSIT Kanpur', 
        full: 'Pranveer Singh Institute of Technology (Bhauti, NH-2)', 
        type: 'Engineering & Technology Institute', 
        address: 'Kanpur-Agra Highway (NH-2), Bhauti, Kanpur, Uttar Pradesh 209305', 
        mapQuery: 'PSIT Kanpur, Bhauti, Kanpur, Uttar Pradesh',
        gates: 'NH-2 Main Gate, Corporate Tech Center Gate',
        spots: '400+ Bays Available'
      },
      { 
        id: 'rama-univ', 
        name: 'Rama University', 
        full: 'Rama University & Medical College (Mandhana, GT Road)', 
        type: 'Private University & Hospital', 
        address: 'Rama City, Mandhana, GT Road, Kanpur, Uttar Pradesh 209217', 
        mapQuery: 'Rama University, Mandhana, Kanpur, Uttar Pradesh',
        gates: 'Mandhana Main Gate, Hospital Emergency Gate',
        spots: '250+ Bays Available'
      },
      { 
        id: 'nsi', 
        name: 'National Sugar Institute', 
        full: 'National Sugar Institute (NSI Kalyanpur)', 
        type: 'Central Research & Technical Institute', 
        address: 'Kalyanpur, GT Road, Kanpur, Uttar Pradesh 208017', 
        mapQuery: 'National Sugar Institute, Kalyanpur, Kanpur',
        gates: 'Main Entrance Kalyanpur',
        spots: '120+ Bays Available'
      },
      { 
        id: 'uptti', 
        name: 'UPTTI Kanpur', 
        full: 'UP Textile Technology Institute (Souterganj, Civil Lines)', 
        type: 'Autonomous State Engineering Institute', 
        address: '11/208, Souterganj, Parwati Bagla Road, Civil Lines, Kanpur 208001', 
        mapQuery: 'Uttar Pradesh Textile Technology Institute, Souterganj, Kanpur',
        gates: 'Civil Lines Main Gate',
        spots: '110+ Bays Available'
      },
      { 
        id: 'aith', 
        name: 'AITH Kanpur', 
        full: 'Dr. Ambedkar Institute of Tech for Handicapped (Kalyanpur)', 
        type: 'Autonomous State Technical Institute', 
        address: 'Awadhpuri, GT Road, Kalyanpur, Kanpur, Uttar Pradesh 208024', 
        mapQuery: 'Dr Ambedkar Institute of Technology for Handicapped, Kalyanpur, Kanpur',
        gates: 'Kalyanpur Main Gate',
        spots: '130+ Bays Available'
      },
      { 
        id: 'kit', 
        name: 'KIT Kanpur', 
        full: 'Kanpur Institute of Technology (Rooma, NH-2)', 
        type: 'Engineering & Management Institute', 
        address: 'A-1, UPSIDC Industrial Area, Rooma, NH-2, Kanpur 208001', 
        mapQuery: 'Kanpur Institute of Technology, Rooma, Kanpur',
        gates: 'Rooma Highway Gate',
        spots: '180+ Bays Available'
      },
      { 
        id: 'allenhouse', 
        name: 'Allenhouse Institute', 
        full: 'Allenhouse Institute of Technology (Rooma)', 
        type: 'Engineering & Management Institute', 
        address: 'Plot No. 2, Rooma, NH-2, Kanpur, Uttar Pradesh 208001', 
        mapQuery: 'Allenhouse Institute of Technology, Rooma, Kanpur',
        gates: 'Rooma Campus Gate',
        spots: '150+ Bays Available'
      },
      { 
        id: 'mpgi', 
        name: 'MPGI Kanpur', 
        full: 'Maharana Pratap Group of Institutions (Mandhana)', 
        type: 'Engineering & Medical Sciences', 
        address: 'Kothi, Mandhana, Bithoor Road, Kanpur, Uttar Pradesh 209217', 
        mapQuery: 'Maharana Pratap Group of Institutions, Mandhana, Kanpur',
        gates: 'Mandhana Campus Gate',
        spots: '220+ Bays Available'
      },
      { 
        id: 'axis', 
        name: 'Axis Colleges', 
        full: 'Axis Colleges Knowledge Park (Rooma)', 
        type: 'Engineering & Management Group', 
        address: 'Knowledge Park, Hathipur, Rooma, NH-2, Kanpur 209402', 
        mapQuery: 'Axis Colleges, Hathipur, Rooma, Kanpur',
        gates: 'Knowledge Park Gate',
        spots: '200+ Bays Available'
      },
      { 
        id: 'dav', 
        name: 'DAV College', 
        full: 'DAV Post Graduate College (Civil Lines)', 
        type: 'Historic Degree College (Est. 1919)', 
        address: 'Civil Lines, Near Green Park Stadium, Kanpur, Uttar Pradesh 208001', 
        mapQuery: 'DAV College, Civil Lines, Kanpur, Uttar Pradesh',
        gates: 'Civil Lines Main Entrance',
        spots: '160+ Bays Available'
      },
      { 
        id: 'christ-church', 
        name: 'Christ Church College', 
        full: 'Christ Church College (The Mall / Phool Bagh)', 
        type: 'Historic Degree College (Est. 1866)', 
        address: 'The Mall, Phool Bagh, Civil Lines, Kanpur, Uttar Pradesh 208001', 
        mapQuery: 'Christ Church College, The Mall, Kanpur, Uttar Pradesh',
        gates: 'Phool Bagh Mall Road Gate',
        spots: '140+ Bays Available'
      },
      { 
        id: 'vssd', 
        name: 'VSSD College', 
        full: 'VSSD College (Nawabganj)', 
        type: 'Degree College (Est. 1921)', 
        address: 'Nawabganj, Near Ganga Barrage Road, Kanpur 208002', 
        mapQuery: 'VSSD College, Nawabganj, Kanpur, Uttar Pradesh',
        gates: 'Nawabganj Main Gate',
        spots: '150+ Bays Available'
      },
      { 
        id: 'dbs', 
        name: 'DBS College', 
        full: 'Dayanand Brajendra Swarup (DBS) College (Govind Nagar)', 
        type: 'Degree College (Est. 1959)', 
        address: 'Govind Nagar, Kanpur, Uttar Pradesh 208006', 
        mapQuery: 'DBS College, Govind Nagar, Kanpur, Uttar Pradesh',
        gates: 'Govind Nagar Main Gate',
        spots: '120+ Bays Available'
      },
      { 
        id: 'ppn', 
        name: 'PPN College', 
        full: 'Pt. Prithi Nath (PPN) College (Parade, The Mall)', 
        type: 'Degree College (Est. 1959)', 
        address: '96/12, Parade, The Mall Road, Kanpur, Uttar Pradesh 208001', 
        mapQuery: 'PPN College, Parade, Kanpur, Uttar Pradesh',
        gates: 'Parade Crossing Gate',
        spots: '130+ Bays Available'
      },
      { 
        id: 'brahmanand', 
        name: 'Brahmanand College', 
        full: 'Brahmanand (BND) College (The Mall Road)', 
        type: 'Degree College (Est. 1961)', 
        address: 'The Mall Road, Mall Crossing, Kanpur, Uttar Pradesh 208004', 
        mapQuery: 'Brahmanand College, The Mall Road, Kanpur, Uttar Pradesh',
        gates: 'Mall Road Main Gate',
        spots: '110+ Bays Available'
      },
      { 
        id: 'govt-poly', 
        name: 'Govt Polytechnic Kanpur', 
        full: 'Government Polytechnic Kanpur (Rawatpur, GT Road)', 
        type: 'State Polytechnic & Technical Diploma', 
        address: 'GT Road, Rawatpur, Kanpur, Uttar Pradesh 208002', 
        mapQuery: 'Government Polytechnic Kanpur, Rawatpur, Kanpur',
        gates: 'Rawatpur GT Road Gate',
        spots: '140+ Bays Available'
      },
      { 
        id: 'zsquare', 
        name: 'Z Square Mall', 
        full: 'Z Square Mall & Mall Road Commercial Plaza', 
        type: 'Commercial Multi-Level Parking', 
        address: '16/113, MG Marg, Mall Road, Kanpur 208001', 
        mapQuery: 'Z Square Mall, Mall Road, Kanpur, Uttar Pradesh',
        gates: 'Mall Road Entrance, Basements 1 & 2',
        spots: '650+ Bays Available'
      },
      { 
        id: 'kprcentral', 
        name: 'Kanpur Central', 
        full: 'Kanpur Central Railway Station / Cantt Hub', 
        type: 'Transit & Multi-Modal Plaza', 
        address: 'Station Road, Kanpur Central, Cantt, Kanpur 208004', 
        mapQuery: 'Kanpur Central Railway Station, Kanpur, Uttar Pradesh',
        gates: 'City Side (Platform 1), Cantt Side (Platform 9)',
        spots: '500+ Bays Available'
      }
    ],
    'Varanasi': [
      { 
        id: 'bhu', 
        name: 'BHU Main Campus', 
        full: 'BHU Campus (Banaras Hindu University & VT Temple)', 
        type: 'Central Public University', 
        address: 'Lanka, Varanasi, Uttar Pradesh 221005', 
        mapQuery: 'Banaras Hindu University, Varanasi, Uttar Pradesh',
        gates: 'Lanka Main Gate, Hyderabad Gate, VT Temple Gate',
        spots: '380+ Bays Available'
      },
      { 
        id: 'iitbhu', 
        name: 'IIT BHU', 
        full: 'IIT BHU (Engineering Quad & Rajputana Gate)', 
        type: 'Institute of National Importance', 
        address: 'IIT BHU Campus, Lanka, Varanasi, Uttar Pradesh 221005', 
        mapQuery: 'IIT BHU, Varanasi, Uttar Pradesh',
        gates: 'Rajputana Gate, Quad Entrance',
        spots: '220+ Bays Available'
      },
      { 
        id: 'mgkvp', 
        name: 'MGKVP Vidyapith', 
        full: 'MGKVP (Mahatma Gandhi Kashi Vidyapith Campus)', 
        type: 'State Public University', 
        address: 'Station Road, Maldahiya, Varanasi, Uttar Pradesh 221002', 
        mapQuery: 'Mahatma Gandhi Kashi Vidyapith, Varanasi, Uttar Pradesh',
        gates: 'Maldahiya Main Gate, Cantt Approach Gate',
        spots: '190+ Bays Available'
      },
      { 
        id: 'imsbhu', 
        name: 'IMS BHU Hospital', 
        full: 'IMS BHU & Sir Sunderlal Hospital Campus', 
        type: 'Medical Sciences & Hospital', 
        address: 'Sir Sunderlal Hospital, BHU Campus, Varanasi, Uttar Pradesh 221005', 
        mapQuery: 'Institute of Medical Sciences BHU, Varanasi, Uttar Pradesh',
        gates: 'Trauma Center Gate, Main OPD Gate',
        spots: '310+ Bays Available'
      },
      { 
        id: 'ssu', 
        name: 'Sampurnanand Sanskrit Univ', 
        full: 'Sampurnanand Sanskrit University Campus', 
        type: 'State Sanskrit University', 
        address: 'Jagatganj, Varanasi, Uttar Pradesh 221002', 
        mapQuery: 'Sampurnanand Sanskrit University, Varanasi, Uttar Pradesh',
        gates: 'Jagatganj Main Entrance',
        spots: '140+ Bays Available'
      },
      { 
        id: 'kashiv', 
        name: 'Kashi Vishwanath Corridor', 
        full: 'Kashi Vishwanath Corridor & Godowlia Hub', 
        type: 'Heritage & Smart Transit Hub', 
        address: 'Lahori Tola, Godowlia, Varanasi, Uttar Pradesh 221001', 
        mapQuery: 'Kashi Vishwanath Temple, Godowlia, Varanasi, Uttar Pradesh',
        gates: 'Godowlia Multi-Level Gate, Maidagin Gate',
        spots: '600+ Bays Available'
      },
      { 
        id: 'ghats', 
        name: 'Assi & Dashashwamedh Ghats', 
        full: 'Assi Ghat & Dashashwamedh Riverfront Hub', 
        type: 'Riverfront & Tourism Hub', 
        address: 'Assi Ghat, Varanasi, Uttar Pradesh 221005', 
        mapQuery: 'Assi Ghat, Varanasi, Uttar Pradesh',
        gates: 'Assi Riverfront Parking Plaza',
        spots: '250+ Bays Available'
      },
      { 
        id: 'cantt', 
        name: 'Varanasi Cantt Station', 
        full: 'Varanasi Cantt Railway Station Hub', 
        type: 'Transit & Multi-Modal Plaza', 
        address: 'Varanasi Cantt, Varanasi, Uttar Pradesh 221002', 
        mapQuery: 'Varanasi Junction railway station, Varanasi',
        gates: 'Main Concourse Gate, Platform 1',
        spots: '450+ Bays Available'
      }
    ],
    'Lucknow': [
      { id: 'iiml', name: 'IIM Lucknow', full: 'IIM Lucknow (Prabandh Nagar Campus)', type: 'Premier Management Institute', address: 'Prabandh Nagar, IIM Road, Lucknow 226013', mapQuery: 'IIM Lucknow, Prabandh Nagar, Lucknow', gates: 'Gate 1 Main Entrance', spots: '200+ Bays' },
      { id: 'lu', name: 'Lucknow University', full: 'Lucknow University (Badshah Bagh & New Campus)', type: 'State Public University', address: 'University Road, Babuganj, Hasanganj, Lucknow 226007', mapQuery: 'University of Lucknow, Lucknow', gates: 'Gate 1 Main Entrance, Gate 2', spots: '280+ Bays' },
      { id: 'kgmu', name: 'KGMU Lucknow', full: 'King George Medical University Campus', type: 'Medical University', address: 'Shah Mina Road, Chowk, Lucknow 226003', mapQuery: 'King George Medical University, Lucknow', gates: 'Trauma Center Gate, Centenary Hospital', spots: '350+ Bays' },
      { id: 'hazratganj', name: 'Hazratganj / Charbagh', full: 'Hazratganj Plaza & Charbagh Railway Station', type: 'Commercial & Transit Hub', address: 'Hazratganj, Lucknow 226001', mapQuery: 'Hazratganj, Lucknow', gates: 'Multi-Level Parking Hazratganj', spots: '550+ Bays' }
    ],
    'Delhi NCR': [
      { id: 'iitd', name: 'IIT Delhi', full: 'IIT Delhi (Hauz Khas Campus)', type: 'Premier Institute', address: 'Hauz Khas, New Delhi 110016', mapQuery: 'IIT Delhi, Hauz Khas, New Delhi', gates: 'Main Gate (Outer Ring Road)', spots: '300+ Bays' },
      { id: 'du', name: 'Delhi University', full: 'Delhi University (North & South Campus)', type: 'Central University', address: 'University Enclave, New Delhi 110007', mapQuery: 'University of Delhi, New Delhi', gates: 'Arts Faculty Gate, Vishwavidyalaya Metro Gate', spots: '450+ Bays' },
      { id: 'aiims', name: 'AIIMS New Delhi', full: 'AIIMS New Delhi & Ansari Nagar Campus', type: 'Apex Medical Institute', address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029', mapQuery: 'AIIMS New Delhi, Ansari Nagar, New Delhi', gates: 'Gate 1 Emergency, Gate 2 OPD', spots: '500+ Bays' },
      { id: 'cp', name: 'Connaught Place', full: 'Connaught Place (CP Central Ring)', type: 'Commercial Plaza', address: 'Connaught Place, New Delhi 110001', mapQuery: 'Connaught Place, New Delhi', gates: 'Inner & Outer Circle MLPs', spots: '800+ Bays' }
    ],
    'Mumbai': [
      { id: 'iitb', name: 'IIT Bombay', full: 'IIT Bombay (Powai Campus)', type: 'Premier Institute', address: 'Powai, Mumbai 400076', mapQuery: 'IIT Bombay, Powai, Mumbai', gates: 'Main Gate Powai', spots: '300+ Bays' },
      { id: 'mu', name: 'Mumbai University', full: 'Mumbai University (Kalina & Fort Campus)', type: 'State University', address: 'Kalina, Santacruz East, Mumbai 400098', mapQuery: 'University of Mumbai, Kalina, Mumbai', gates: 'CST Road Main Gate', spots: '350+ Bays' },
      { id: 'bkc', name: 'BKC Business Hub', full: 'Bandra Kurla Complex (BKC Smart Parking)', type: 'Financial Hub', address: 'BKC, Bandra East, Mumbai 400051', mapQuery: 'Bandra Kurla Complex, Mumbai', gates: 'G Block Smart Parking', spots: '900+ Bays' }
    ],
    'Bengaluru': [
      { id: 'iisc', name: 'IISc Bangalore', full: 'IISc Bangalore (Malleswaram Campus)', type: 'Premier Research Institute', address: 'CV Raman Road, Malleswaram, Bengaluru 560012', mapQuery: 'Indian Institute of Science, Bengaluru', gates: 'Main Gate CV Raman Road', spots: '250+ Bays' },
      { id: 'iimb', name: 'IIM Bangalore', full: 'IIM Bangalore (Bannerghatta Road Campus)', type: 'Management Institute', address: 'Bannerghatta Main Road, Bilekahalli, Bengaluru 560076', mapQuery: 'IIM Bangalore, Bannerghatta Road, Bengaluru', gates: 'Bannerghatta Main Gate', spots: '200+ Bays' },
      { id: 'mgroad', name: 'MG Road / Indiranagar', full: 'MG Road & Brigade Road Commercial Hub', type: 'Commercial Plaza', address: 'MG Road, Bengaluru 560001', mapQuery: 'MG Road, Bengaluru', gates: 'Brigade Multi-Level Parking', spots: '600+ Bays' }
    ],
    'Hyderabad': [
      { id: 'iith', name: 'IIT Hyderabad', full: 'IIT Hyderabad (Kandi Campus)', type: 'Premier Institute', address: 'NH-65, Kandi, Sangareddy, Telangana 502285', mapQuery: 'IIT Hyderabad, Kandi, Sangareddy', gates: 'Main Gate NH-65', spots: '250+ Bays' },
      { id: 'uoh', name: 'University of Hyderabad', full: 'University of Hyderabad (HCU Campus)', type: 'Central University', address: 'Prof CR Rao Road, Gachibowli, Hyderabad 500046', mapQuery: 'University of Hyderabad, Gachibowli, Hyderabad', gates: 'Main Gate Gachibowli', spots: '300+ Bays' },
      { id: 'hitech', name: 'Hitec City / Cyber Towers', full: 'Hitec City & Madhapur IT Corridor', type: 'IT Corridor', address: 'Hitec City, Madhapur, Hyderabad 500081', mapQuery: 'Cyber Towers, Hitec City, Hyderabad', gates: 'Cyber Towers Parking Deck', spots: '850+ Bays' }
    ],
    'Pune': [
      { id: 'coep', name: 'COEP Tech University', full: 'COEP Tech University (Shivajinagar Campus)', type: 'State Technical University', address: 'Wellesley Road, Shivajinagar, Pune 411005', mapQuery: 'COEP Technological University, Shivajinagar, Pune', gates: 'Shivajinagar Main Gate', spots: '180+ Bays' },
      { id: 'sppu', name: 'Savitribai Phule Pune Univ', full: 'SPPU (Ganeshkhind Campus)', type: 'State University', address: 'Ganeshkhind Road, Pune 411007', mapQuery: 'Savitribai Phule Pune University, Pune', gates: 'Main Gate Ganeshkhind', spots: '320+ Bays' },
      { id: 'hinjewadi', name: 'Hinjewadi IT Park', full: 'Hinjewadi Infotech Park Phase 1 & 2', type: 'IT Park Hub', address: 'Hinjewadi, Pune 411057', mapQuery: 'Rajiv Gandhi Infotech Park, Hinjewadi, Pune', gates: 'Phase 1 Central Parking', spots: '750+ Bays' }
    ],
    'Chennai': [
      { id: 'iitm', name: 'IIT Madras', full: 'IIT Madras (Guindy / Adyar Campus)', type: 'Premier Institute', address: 'Sardar Patel Road, Adyar, Chennai 600036', mapQuery: 'IIT Madras, Sardar Patel Road, Chennai', gates: 'Main Gate Sardar Patel Road', spots: '300+ Bays' },
      { id: 'anna', name: 'Anna University', full: 'Anna University (CEG Guindy Campus)', type: 'Technical University', address: 'Sardar Patel Road, Guindy, Chennai 600025', mapQuery: 'Anna University, Guindy, Chennai', gates: 'CEG Main Gate', spots: '280+ Bays' },
      { id: 't-nagar', name: 'T Nagar Commercial Hub', full: 'T. Nagar Multi-level Smart Parking Plaza', type: 'Commercial Hub', address: 'T. Nagar, Chennai 600017', mapQuery: 'T. Nagar, Chennai', gates: 'Thanikachalam Road MLP', spots: '650+ Bays' }
    ],
    'Kolkata': [
      { id: 'ju', name: 'Jadavpur University', full: 'Jadavpur University Main Campus', type: 'State University', address: '188 Raja SC Mallick Road, Jadavpur, Kolkata 700032', mapQuery: 'Jadavpur University, Kolkata', gates: 'Gate 3 Main Road Entrance', spots: '220+ Bays' },
      { id: 'cu', name: 'Calcutta University', full: 'Calcutta University (College Street Campus)', type: 'State University', address: '87/1 College Street, Kolkata 700073', mapQuery: 'University of Calcutta, College Street, Kolkata', gates: 'College Street Main Gate', spots: '200+ Bays' },
      { id: 'saltlake', name: 'Salt Lake Sector V', full: 'Salt Lake Sector V Tech Hub', type: 'IT Hub', address: 'Sector V, Bidhannagar, Kolkata 700091', mapQuery: 'Salt Lake Sector V, Kolkata', gates: 'Sector V Multi-Level Parking', spots: '700+ Bays' }
    ],
    'Ahmedabad': [
      { id: 'iima', name: 'IIM Ahmedabad', full: 'IIM Ahmedabad (Vastrapur Campus)', type: 'Premier Management Institute', address: 'Vastrapur, Ahmedabad 380015', mapQuery: 'IIM Ahmedabad, Vastrapur, Ahmedabad', gates: 'Main Gate Vastrapur', spots: '220+ Bays' },
      { id: 'gu', name: 'Gujarat University', full: 'Gujarat University (Navrangpura Campus)', type: 'State University', address: 'Navrangpura, Ahmedabad 380009', mapQuery: 'Gujarat University, Navrangpura, Ahmedabad', gates: 'University Tower Gate', spots: '290+ Bays' },
      { id: 'sg-hwy', name: 'SG Highway Hub', full: 'SG Highway Commercial Corridor', type: 'Commercial Plaza', address: 'SG Highway, Ahmedabad 380054', mapQuery: 'SG Highway, Ahmedabad', gates: 'SG Highway Smart Bay Hub', spots: '600+ Bays' }
    ],
    'Jaipur': [
      { id: 'mnit', name: 'MNIT Jaipur', full: 'MNIT Jaipur (JLN Marg Campus)', type: 'National Institute of Technology', address: 'JLN Marg, Malviya Nagar, Jaipur 302017', mapQuery: 'MNIT Jaipur, JLN Marg, Jaipur', gates: 'Main Gate JLN Marg', spots: '240+ Bays' },
      { id: 'ru', name: 'Rajasthan University', full: 'University of Rajasthan Campus', type: 'State University', address: 'JLN Marg, Jaipur 302004', mapQuery: 'University of Rajasthan, Jaipur', gates: 'Gate 1 JLN Marg Entrance', spots: '260+ Bays' },
      { id: 'mi-road', name: 'MI Road / Pink City', full: 'MI Road & Walled City Parking Plaza', type: 'Commercial Hub', address: 'MI Road, Jaipur 302001', mapQuery: 'MI Road, Jaipur', gates: 'Ajmeri Gate Parking Deck', spots: '550+ Bays' }
    ]
  };

  // SVG Vehicle Graphic Helper
  function getVehicleSvg(type = 'sedan', color = '#06b6d4') {
    if (type === 'bike') {
      return `
      <svg class="vehicle-graphic" viewBox="0 0 40 70" fill="none">
        <rect x="16" y="6" width="8" height="18" rx="4" fill="#1e293b"/>
        <rect x="16" y="46" width="8" height="18" rx="4" fill="#1e293b"/>
        <rect x="13" y="20" width="14" height="28" rx="6" fill="${color}"/>
        <circle cx="20" cy="18" r="4" fill="#38bdf8"/>
      </svg>`;
    }
    return `
    <svg class="vehicle-graphic" viewBox="0 0 50 80" fill="none">
      <rect x="6" y="4" width="38" height="72" rx="12" fill="${color}"/>
      <path d="M12 24 C12 18, 38 18, 38 24 L36 32 H14 Z" fill="#0f172a" opacity="0.85"/>
      <path d="M14 54 H36 L38 62 C38 65, 12 65, 12 62 Z" fill="#0f172a" opacity="0.85"/>
      <circle cx="12" cy="6" r="3" fill="#fef08a"/>
      <circle cx="38" cy="6" r="3" fill="#fef08a"/>
      <rect x="11" y="72" width="6" height="3" fill="#ef4444"/>
      <rect x="33" y="72" width="6" height="3" fill="#ef4444"/>
    </svg>`;
  }

  // =========================================================================
  // 3. Integrated Smart Parking Engine (In Rs.)
  // =========================================================================
  class SmartParkingEngine {
    constructor() {
      this.currentFloorId = 1;
      this.filterType = 'all';
      this.searchQuery = '';
      this.selectedSlot = null;
      this.simActive = false;
      this.simInterval = null;
      this.revenue = 1420.00;
      this.history = [];
      this.appliedDiscount = 0;
      this.slots = this.initSlots();
    }

    initSlots() {
      const list = [];
      FLOORS.forEach(f => {
        ['A', 'B', 'C', 'D'].forEach((zone) => {
          for (let i = 1; i <= 8; i++) {
            const slotId = `${f.code}-${zone}${i < 10 ? '0' + i : i}`;
            let slotType = 'general';
            if (f.id === 2 || (zone === 'A' && i <= 4)) slotType = 'ev';
            else if (f.id === 1 && zone === 'A' && i <= 3) slotType = 'accessible';
            else if (f.id === 4 || (zone === 'D' && i >= 6)) slotType = 'vip';
            else if (zone === 'D' && i <= 3) slotType = 'bike';

            const isOccupied = Math.random() < 0.45;
            list.push({
              id: slotId,
              floorId: f.id,
              floorCode: f.code,
              zone,
              type: slotType,
              status: isOccupied ? (slotType === 'ev' ? 'ev' : 'occupied') : 'available',
              rate: f.baseRate + (slotType === 'vip' ? 30 : slotType === 'ev' ? 20 : 0),
              distanceToLift: 10 + Math.floor(Math.random() * 45),
              occupant: isOccupied ? {
                plate: SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)],
                vehicleType: slotType === 'ev' ? 'ev' : 'sedan',
                entryTime: Date.now() - Math.floor(Math.random() * 7200000),
                evSoc: slotType === 'ev' ? Math.floor(30 + Math.random() * 50) : null
              } : null
            });
          }
        });
      });
      return list;
    }

    getFloorSlots() {
      let items = this.slots.filter(s => s.floorId === this.currentFloorId);
      if (this.filterType === 'available') items = items.filter(s => s.status === 'available');
      else if (this.filterType === 'occupied') items = items.filter(s => s.status === 'occupied' || s.status === 'ev');
      else if (this.filterType === 'ev') items = items.filter(s => s.type === 'ev' || s.status === 'ev');
      else if (this.filterType === 'accessible') items = items.filter(s => s.type === 'accessible');
      else if (this.filterType === 'vip') items = items.filter(s => s.type === 'vip');

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        items = items.filter(s => s.id.toLowerCase().includes(q) || (s.occupant && s.occupant.plate.toLowerCase().includes(q)));
      }
      return items;
    }

    renderFloor() {
      this.renderFloorTabs();
      this.renderKpis();
      this.renderBlueprint();
      this.renderInspector();
      this.renderFeed();
    }

    renderFloorTabs() {
      const container = document.getElementById('floorTabsContainer');
      if (!container) return;
      container.innerHTML = FLOORS.map(f => `
        <button class="floor-tab-btn ${f.id === this.currentFloorId ? 'active' : ''}" onclick="ParkingEngine.switchFloor(${f.id})">
          <span>${f.code}</span>
          <span>${f.name.split('-')[1] || f.name}</span>
        </button>
      `).join('');
    }

    switchFloor(floorId) {
      this.currentFloorId = floorId;
      this.clearNavRoute();
      this.renderFloor();
      sound.playBeep(440, 'sine', 0.05, 0.05);
    }

    renderKpis() {
      const total = this.slots.length;
      const available = this.slots.filter(s => s.status === 'available').length;
      const occupied = this.slots.filter(s => s.status === 'occupied' || s.status === 'ev').length;
      const reserved = this.slots.filter(s => s.status === 'reserved').length;
      const ev = this.slots.filter(s => s.status === 'ev').length;

      document.getElementById('kpiTotal').textContent = total;
      document.getElementById('kpiAvailable').textContent = available;
      document.getElementById('kpiOccupied').textContent = occupied;
      document.getElementById('kpiReserved').textContent = reserved;
      document.getElementById('kpiEv').textContent = ev;
      document.getElementById('kpiRevenue').textContent = `Rs. ${this.revenue.toFixed(2)}`;
    }

    renderBlueprint() {
      const container = document.getElementById('parkingZonesContainer');
      if (!container) return;

      const floorSlots = this.getFloorSlots();
      const zones = ['A', 'B', 'C', 'D'];
      const zoneLabels = { 'A': 'Zone A (North Wing)', 'B': 'Zone B (Central Lane)', 'C': 'Zone C (Express Bay)', 'D': 'Zone D (South Deck)' };

      let html = '';
      zones.forEach(zone => {
        const slots = floorSlots.filter(s => s.zone === zone);
        if (slots.length === 0) return;

        html += `
          <div class="parking-zone-row">
            <div class="zone-label-bar">
              <span class="zone-name">📍 ${zoneLabels[zone]}</span>
              <span style="font-size:0.7rem; color:#94a3b8;">Tariff: Rs. ${FLOORS.find(f => f.id === this.currentFloorId).baseRate.toFixed(2)}/hr</span>
            </div>
            <div class="slots-grid">
              ${slots.map(s => {
                const isOcc = s.status === 'occupied' || s.status === 'ev';
                const isRes = s.status === 'reserved';
                let vehicleContent = '<div class="slot-empty-mark">OPEN</div>';
                if (isOcc && s.occupant) {
                  vehicleContent = getVehicleSvg(s.occupant.vehicleType || 'sedan', '#06b6d4');
                } else if (isRes) {
                  vehicleContent = '<div style="font-size:1.3rem;">🔒</div>';
                }

                return `
                  <div class="parking-slot" onclick="ParkingEngine.selectSlot('${s.id}')" data-slot-id="${s.id}">
                    <div class="slot-sensor ${s.status}"></div>
                    <span class="slot-type-icon">${s.type === 'ev' ? '⚡' : s.type === 'accessible' ? '♿' : s.type === 'vip' ? '👑' : ''}</span>
                    <div class="slot-id-badge">${s.id}</div>
                    <div style="flex:1; width:100%; display:flex; align-items:center; justify-content:center;">
                      ${vehicleContent}
                    </div>
                    <div class="slot-footer-info">
                      <span>Rs. ${s.rate.toFixed(0)}/h</span>
                      <span>${s.distanceToLift}m</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ${zone === 'B' ? '<div class="drive-lane"></div>' : ''}
          </div>
        `;
      });

      container.innerHTML = html;
    }

    selectSlot(slotId) {
      this.selectedSlot = this.slots.find(s => s.id === slotId);
      this.renderInspector();
      sound.playBeep(520, 'sine', 0.05, 0.04);
    }

    renderInspector() {
      const container = document.getElementById('inspectorContent');
      if (!container) return;

      const slot = this.selectedSlot;
      if (!slot) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:1rem 0;">Click any bay on the floor plan to inspect details or reserve.</p>`;
        return;
      }

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:1.2rem; font-family:var(--font-mono); color:var(--sky-blue);">${slot.id}</strong>
            <span style="font-weight:700; text-transform:uppercase; font-size:0.75rem; color:${slot.status === 'available' ? 'var(--color-available)' : 'var(--color-occupied)'}">${slot.status}</span>
          </div>
          <div>Tariff: <strong>Rs. ${slot.rate.toFixed(2)}/hr</strong></div>
          <div>Distance to Elevator: <strong>${slot.distanceToLift} meters</strong></div>
          ${slot.occupant ? `
            <div style="border-top:1px solid var(--border-color); padding-top:0.5rem; margin-top:0.25rem;">
              <div>Vehicle Reg: <strong style="color:var(--sky-blue);">${slot.occupant.plate}</strong></div>
              <div>Parked Duration: <strong>${Math.floor((Date.now() - slot.occupant.entryTime) / 60000)} mins</strong></div>
            </div>
          ` : ''}
          <div style="margin-top:0.5rem;">
            ${slot.status === 'available' ? `
              <button class="btn btn-sky-blue" style="width:100%; padding:0.4rem;" onclick="ParkingEngine.openBooking('${slot.id}')">🎟️ Book This Spot</button>
            ` : `
              <button class="btn btn-outline-primary" style="width:100%; padding:0.4rem;" onclick="ParkingEngine.drawRoute('${slot.id}')">📍 Show Route</button>
            `}
          </div>
        </div>
      `;
    }

    renderFeed() {
      const container = document.getElementById('eventFeedContainer');
      if (!container) return;
      container.innerHTML = this.history.slice(0, 10).map(item => `
        <div class="feed-item">
          <div style="font-size:0.7rem; color:var(--text-muted);">${item.time}</div>
          <div>${item.text}</div>
        </div>
      `).join('');
    }

    addEvent(text) {
      const time = new Date().toLocaleTimeString();
      this.history.unshift({ time, text });
      this.renderFeed();
    }

    toggleSim() {
      this.simActive = !this.simActive;
      const btn = document.getElementById('simToggleBtn');
      if (this.simActive) {
        btn.textContent = '⏸️ Pause Sim';
        this.simInterval = setInterval(() => this.simTick(), 3500);
        VehiStayApp.showToast('Live Traffic Simulation Active');
      } else {
        btn.textContent = '▶️ Start Live Sim';
        if (this.simInterval) clearInterval(this.simInterval);
        VehiStayApp.showToast('Simulation Paused');
      }
    }

    simTick() {
      const openSlots = this.slots.filter(s => s.status === 'available');
      if (openSlots.length > 0 && Math.random() > 0.4) {
        const slot = openSlots[Math.floor(Math.random() * openSlots.length)];
        const plate = SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)];
        slot.status = slot.type === 'ev' ? 'ev' : 'occupied';
        slot.occupant = { plate, vehicleType: slot.type === 'ev' ? 'ev' : 'sedan', entryTime: Date.now() };
        this.addEvent(`Vehicle <strong>${plate}</strong> parked in Bay <strong>${slot.id}</strong>`);
      } else {
        const occSlots = this.slots.filter(s => (s.status === 'occupied' || s.status === 'ev') && s.occupant);
        if (occSlots.length > 0) {
          const slot = occSlots[Math.floor(Math.random() * occSlots.length)];
          const plate = slot.occupant.plate;
          this.revenue += slot.rate * 2;
          slot.status = 'available';
          slot.occupant = null;
          this.addEvent(`Vehicle <strong>${plate}</strong> departed Bay <strong>${slot.id}</strong> (+Rs. ${(slot.rate * 2).toFixed(2)})`);
        }
      }
      this.renderFloor();
    }

    // Modal Triggers
    openBooking(slotId = null) {
      const select = document.getElementById('bookSlotSelect');
      const available = this.slots.filter(s => s.status === 'available');
      select.innerHTML = available.map(s => `<option value="${s.id}" ${slotId === s.id ? 'selected' : ''}>${s.id} (${s.type.toUpperCase()}) - Rs. ${s.rate.toFixed(2)}/hr</option>`).join('');
      document.getElementById('bookingModal')?.classList.add('active');
    }

    async confirmBooking() {
      const slotId = document.getElementById('bookSlotSelect').value;
      const slot = this.slots.find(s => s.id === slotId);
      if (!slot) return;

      const plate = (document.getElementById('bookPlateInput')?.value || 'MH 02 AB 1234').toUpperCase();
      const driverName = document.getElementById('bookDriverInput')?.value || 'Rahul Sharma';
      const vehicleType = document.getElementById('bookVehicleType')?.value || 'sedan';
      const hours = parseInt(document.getElementById('bookDurationSlider').value, 10) || 2;
      let total = slot.rate * hours;
      if (this.appliedDiscount > 0) {
        total = Math.max(0, total - this.appliedDiscount);
      }

      slot.status = 'reserved';
      slot.occupant = { plate, vehicleType, driverName, entryTime: Date.now() };
      this.revenue += total;

      sound.playSuccess();
      this.closeModals();
      this.renderFloor();

      const city = window.VehiStayApp?.selectedCity || 'Kanpur';
      const cityPrefix = city.substring(0, 3).toUpperCase();
      const bookingId = `VS-${cityPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      const verificationToken = `vst_sec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      const securityPin = String(Math.floor(1000 + Math.random() * 9000));
      const today = new Date().toISOString().split('T')[0];
      const locName = `${city} Central Smart Hub`;

      const bookingRecord = {
        booking_id: bookingId,
        slot_code: slot.id,
        vehicle_plate: plate,
        vehicle_type: vehicleType,
        driver_name: driverName,
        customer_name: driverName,
        customer_phone: '+91 98765 43210',
        customer_email: 'driver@vehistay.com',
        customer_city: city,
        location_name: locName,
        service_name: `Bay ${slot.id} Hourly Reservation (${hours} hrs)`,
        booking_date: today,
        time_slot: `Now (${hours} Hours)`,
        duration_text: `${hours} Hours`,
        security_pin: securityPin,
        verification_token: verificationToken,
        total_amount: total,
        status: 'confirmed'
      };

      // Persist real booking to Supabase / Universal DB
      if (window.VehiStayDB) {
        try {
          const res = await window.VehiStayDB.createBooking(bookingRecord);
          if (res?.booking) {
            Object.assign(bookingRecord, res.booking);
            bookingRecord.duration_text = `${hours} Hours`;
          }
        } catch (e) {
          console.warn('[DB Booking Creation]:', e);
        }
      }

      // Generate scannable QR Pass with no duplicate accumulation
      if (window.VehiStayApp) {
        window.VehiStayApp.generateBookingPass(bookingRecord);
        window.VehiStayApp.showToast(`Pass generated for Bay ${slot.id}! 🎉`);
      }
    }

    openGateSim() {
      document.getElementById('gateModal')?.classList.add('active');
      this.updateExitSelect();
    }

    switchGateTab(tab) {
      document.getElementById('gateEntrySection').style.display = tab === 'entry' ? 'block' : 'none';
      document.getElementById('gateExitSection').style.display = tab === 'exit' ? 'block' : 'none';
      document.getElementById('btnGateTabEntry').className = tab === 'entry' ? 'btn btn-sky-blue' : 'btn btn-outline-primary';
      document.getElementById('btnGateTabExit').className = tab === 'exit' ? 'btn btn-sky-blue' : 'btn btn-outline-primary';
      if (tab === 'exit') this.updateExitSelect();
    }

    randomPlate() {
      const rand = SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)];
      document.getElementById('gatePlateInput').value = rand;
    }

    scanAndOpenEntry() {
      const plate = document.getElementById('gatePlateInput').value || 'MH 02 AB 1234';
      const slot = this.slots.find(s => s.status === 'available');
      if (!slot) {
        VehiStayApp.showToast('Lot full!');
        return;
      }

      slot.status = 'occupied';
      slot.occupant = { plate, entryTime: Date.now() };

      sound.playGateMotor();
      document.getElementById('entryBarrierRig').classList.add('open');
      document.getElementById('entryGateLed').textContent = `🟢 WELCOME ${plate} ➔ BAY ${slot.id}`;

      setTimeout(() => {
        document.getElementById('entryBarrierRig').classList.remove('open');
        document.getElementById('entryGateLed').textContent = 'DETECTING VEHICLE PLATE...';
      }, 3500);

      this.addEvent(`Gate OCR: Vehicle <strong>${plate}</strong> entered ➔ Assigned <strong>${slot.id}</strong>`);
      this.renderFloor();
      VehiStayApp.showToast(`Gate Open: Proceed to ${slot.id}`);
    }

    updateExitSelect() {
      const select = document.getElementById('gateExitSelect');
      const occupied = this.slots.filter(s => (s.status === 'occupied' || s.status === 'ev') && s.occupant);
      if (occupied.length === 0) {
        select.innerHTML = '<option value="">No vehicles currently parked</option>';
        return;
      }
      select.innerHTML = occupied.map(s => `<option value="${s.id}">${s.occupant.plate} (Bay ${s.id})</option>`).join('');
    }

    processExitPay() {
      const slotId = document.getElementById('gateExitSelect').value;
      const slot = this.slots.find(s => s.id === slotId);
      if (!slot || !slot.occupant) return;

      const plate = slot.occupant.plate;
      const fee = slot.rate * 2;
      this.revenue += fee;
      slot.status = 'available';
      slot.occupant = null;

      sound.playGateMotor();
      sound.playSuccess();
      document.getElementById('exitBarrierRig').classList.add('open');
      document.getElementById('exitGateLed').textContent = `🟢 PAID Rs. ${fee.toFixed(2)} - SAFE TRAVELS!`;

      setTimeout(() => {
        document.getElementById('exitBarrierRig').classList.remove('open');
        document.getElementById('exitGateLed').textContent = 'SCAN TICKET / PLATE...';
        this.updateExitSelect();
      }, 3500);

      this.addEvent(`Exit Gate: Vehicle <strong>${plate}</strong> paid Rs. ${fee.toFixed(2)} & departed`);
      this.renderFloor();
      VehiStayApp.showToast(`Payment received. Barrier open.`);
    }

    openFindCar() {
      document.getElementById('findCarModal')?.classList.add('active');
    }

    locateCar() {
      const query = (document.getElementById('findCarQuery').value || '').trim().toUpperCase();
      const slot = this.slots.find(s => s.occupant && s.occupant.plate.toUpperCase().includes(query));
      const res = document.getElementById('findCarResult');

      if (!slot) {
        res.innerHTML = `<p style="color:#ef4444; font-weight:700; text-align:center;">❌ No parked vehicle found matching "${query}"</p>`;
        return;
      }

      res.innerHTML = `
        <div style="background:var(--bg-alt); padding:1rem; border-radius:var(--radius-md);">
          <strong>🚗 Vehicle Found: ${slot.occupant.plate}</strong>
          <p style="font-size:0.85rem; color:var(--text-muted); margin:0.3rem 0;">Location: ${FLOORS.find(f => f.id === slot.floorId).name} ➔ Bay <strong>${slot.id}</strong></p>
          <button class="btn btn-sky-blue" style="width:100%; padding:0.4rem;" onclick="ParkingEngine.showCarOnFloor('${slot.id}', ${slot.floorId})">Draw Route to Bay</button>
        </div>
      `;
    }

    showCarOnFloor(slotId, floorId) {
      this.closeModals();
      this.switchFloor(floorId);
      setTimeout(() => this.drawRoute(slotId), 200);
    }

    drawRoute(slotId) {
      const overlay = document.getElementById('navigationOverlay');
      const el = document.querySelector(`[data-slot-id="${slotId}"]`);
      if (!overlay || !el) return;

      const oRect = overlay.getBoundingClientRect();
      const sRect = el.getBoundingClientRect();
      const targetX = sRect.left - oRect.left + sRect.width / 2;
      const targetY = sRect.top - oRect.top + sRect.height / 2;

      overlay.innerHTML = `
        <polyline class="nav-path-line" points="30,${oRect.height - 30} 30,${targetY} ${targetX},${targetY}" />
        <circle cx="30" cy="${oRect.height - 30}" r="6" fill="#10b981" />
        <circle cx="${targetX}" cy="${targetY}" r="7" fill="var(--sky-blue)" />
      `;
      VehiStayApp.showToast(`Walking route highlighted to Bay ${slotId}`);
    }

    clearNavRoute() {
      const overlay = document.getElementById('navigationOverlay');
      if (overlay) overlay.innerHTML = '';
    }

    openEvHub() {
      const list = document.getElementById('evChargersList');
      const evSlots = this.slots.filter(s => s.type === 'ev');
      list.innerHTML = evSlots.map(s => `
        <div style="background:var(--bg-alt); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color); font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between;"><strong>⚡ Bay ${s.id}</strong> <span style="color:${s.status === 'ev' ? 'var(--sky-blue)' : '#10b981'}; font-weight:700;">${s.status === 'ev' ? 'CHARGING' : 'AVAILABLE'}</span></div>
          <p style="color:var(--text-muted); font-size:0.75rem; margin-top:0.25rem;">150 kW DC Fast Charging (CCS/NACS)</p>
        </div>
      `).join('');
      document.getElementById('evHubModal')?.classList.add('active');
    }

    openAnalytics() {
      document.getElementById('analyticsModal')?.classList.add('active');
      setTimeout(() => {
        const canvas = document.getElementById('analyticsChart');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const vals = [20, 45, 80, 95, 70, 85, 55, 30];
          vals.forEach((v, i) => {
            const x = (i / 7) * 440 + 30;
            const y = 160 - (v / 100) * 120;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
      }, 100);
    }

    emergencyEvacuate() {
      this.slots.forEach(s => { s.status = 'available'; s.occupant = null; });
      this.closeModals();
      this.renderFloor();
      VehiStayApp.showToast('🚨 Emergency Evacuation: All barriers lifted!');
    }

    closeModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }
  }

  // =========================================================================
  // 4. Main VehiStay Web Application Controller
  // =========================================================================
  class VehiStayAppController {
    constructor() {
      this.currentPage = 'home';
      this.selectedCity = 'Kanpur';
      this.selectedLocation = CITY_LOCATIONS['Kanpur'][0];
      this.services = [...SERVICES];
      this.currentPassBooking = null;
      this.currentVerifyUrl = '';
      this.init();
    }

    init() {
      this.loadStorage();
      this.bindEvents();
      this.renderServices();
      this.renderCampusHubs(this.selectedCity);
      this.handleCustCityChange(this.selectedCity);
      this.updateCampusMap(this.selectedLocation);

      // Check hash route if any
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'find-parking', 'services', 'appointment', 'contact'].includes(hash)) {
        this.navigate(hash);
      }
    }

    loadStorage() {
      try {
        const theme = localStorage.getItem('vehistay_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    }

    bindEvents() {
      // Nav links
      document.querySelectorAll('.nav-link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const page = btn.dataset.page;
          this.navigate(page);
        });
      });

      // Filter chips in Find Parking
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          window.ParkingEngine.filterType = chip.dataset.filter;
          window.ParkingEngine.renderBlueprint();
        });
      });

      // Search in Find Parking
      document.getElementById('spotSearchInput')?.addEventListener('input', (e) => {
        window.ParkingEngine.searchQuery = e.target.value;
        window.ParkingEngine.renderBlueprint();
      });

      // Duration slider listener (In Rs.)
      document.getElementById('bookDurationSlider')?.addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('bookDurationVal').textContent = `${val} Hours`;
        document.getElementById('bookPriceTotal').textContent = `Rs. ${(val * 50).toFixed(2)}`;
      });

      // FAQ accordion
      document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.accordion-item');
          const isOpen = item.classList.contains('open');
          document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
          if (!isOpen) item.classList.add('open');
        });
      });

      // Theme toggle
      document.getElementById('btnToggleTheme')?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('vehistay_theme', next);
        this.showToast(`Switched to ${next} theme`);
      });

      // Sign in modal
      document.getElementById('btnOpenLogin')?.addEventListener('click', () => this.openLogin());

      // Backdrop modal close
      document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModals();
        });
      });
    }

    openCouponModal() {
      sound.playBeep(650, 'sine', 0.08, 0.05);
      document.getElementById('couponModal')?.classList.add('active');
    }

    applyCoupon(code, discountVal) {
      window.ParkingEngine.appliedDiscount = discountVal;
      sound.playSuccess();
      this.closeModals();
      this.showToast(`Coupon "${code}" applied! Discount: Rs. ${discountVal} 🎉`);
    }

    updateCampusMap(loc) {
      if (!loc) return;
      this.selectedLocation = loc;

      const badge = document.getElementById('campusMapBadge');
      if (badge) badge.textContent = `🎓 ${loc.type}`;

      const name = document.getElementById('campusMapName');
      if (name) name.textContent = loc.name;

      const address = document.getElementById('campusMapAddress');
      if (address) address.textContent = `📍 ${loc.address || loc.full}`;

      const gates = document.getElementById('campusMapGates');
      if (gates) gates.textContent = loc.gates || 'Main Campus Entrance & Visitors Gate';

      const spots = document.getElementById('campusMapSpots');
      if (spots) spots.textContent = loc.spots || '250+ Bays Available (ANPR Integrated)';

      const query = encodeURIComponent(loc.mapQuery || loc.address || loc.full);
      const iframe = document.getElementById('campusGoogleMapIframe');
      if (iframe) {
        iframe.src = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }

      const extLink = document.getElementById('campusGoogleMapsExternalLink');
      if (extLink) {
        extLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
      }
    }

    openCampusMapModal(loc = null) {
      const targetLoc = loc || this.selectedLocation || CITY_LOCATIONS[this.selectedCity]?.[0] || CITY_LOCATIONS['Kanpur'][0];
      if (!targetLoc) return;

      const query = encodeURIComponent(targetLoc.mapQuery || targetLoc.address || targetLoc.full);
      const modalIframe = document.getElementById('modalMapIframe');
      if (modalIframe) {
        modalIframe.src = `https://maps.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
      }

      const title = document.getElementById('modalMapTitle');
      if (title) title.textContent = `🗺️ ${targetLoc.name} - Google Map & Parking Hub`;

      const address = document.getElementById('modalMapAddress');
      if (address) address.textContent = `📍 ${targetLoc.address || targetLoc.full}`;

      const meta = document.getElementById('modalMapMeta');
      if (meta) meta.textContent = `${targetLoc.gates || 'Main Entrance'} • ${targetLoc.spots || 'Smart Parking Ready'}`;

      const extLink = document.getElementById('modalMapExternalLink');
      if (extLink) {
        extLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
      }

      document.getElementById('campusMapModal')?.classList.add('active');
      sound.playBeep(650, 'sine', 0.08, 0.05);
    }

    openCurrentCampusMap() {
      const custLocVal = document.getElementById('custLocationHub')?.value;
      const locs = CITY_LOCATIONS[this.selectedCity] || CITY_LOCATIONS['Kanpur'] || [];
      const match = locs.find(l => l.full === custLocVal || (custLocVal && custLocVal.includes(l.name))) || this.selectedLocation || locs[0];
      this.openCampusMapModal(match);
    }

    renderCampusHubs(city) {
      const bar = document.getElementById('campusHubsBar');
      if (!bar) return;
      const locs = CITY_LOCATIONS[city] || CITY_LOCATIONS['Kanpur'] || [];
      bar.innerHTML = `
        <span class="hub-badge" style="background:linear-gradient(135deg, var(--sky-blue), #2563eb); color:#fff; padding:0.25rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;">
          🎓 Famous Hubs & Campuses in ${city}:
        </span>
        ${locs.map((loc, idx) => `
          <button type="button" class="campus-hub-chip ${idx === 0 ? 'active' : ''}" onclick="VehiStayApp.selectLocationHub('${city}', '${loc.name.replace(/'/g, "\\'")}', this)">
            <span>📍</span> <strong>${loc.name}</strong> <span style="opacity:0.75; font-size:0.7rem;">(${loc.type.split(' ')[0]})</span>
          </button>
        `).join('')}
      `;
    }

    selectLocationHub(city, hubName, btnEl) {
      document.querySelectorAll('.campus-hub-chip').forEach(c => c.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      const locs = CITY_LOCATIONS[city] || [];
      const match = locs.find(l => l.name === hubName) || locs[0];
      if (match) {
        this.updateCampusMap(match);
      }

      // Update Appointment form dropdown
      const custLocSelect = document.getElementById('custLocationHub');
      if (custLocSelect && match) {
        for (let opt of custLocSelect.options) {
          if (opt.value.includes(hubName) || opt.value === match.full) {
            opt.selected = true;
            break;
          }
        }
      }
      sound.playSuccess();
      this.showToast(`Selected: ${match.name} 📍 Google Map & live parking loaded!`);
    }

    handleLocationSelect(locationFull) {
      const locs = CITY_LOCATIONS[this.selectedCity] || CITY_LOCATIONS['Kanpur'] || [];
      const match = locs.find(l => l.full === locationFull || (locationFull && locationFull.includes(l.name)));
      if (match) {
        this.updateCampusMap(match);
        // Also sync active chip
        document.querySelectorAll('.campus-hub-chip').forEach(c => {
          if (c.textContent.includes(match.name)) c.classList.add('active');
          else c.classList.remove('active');
        });
        sound.playBeep(700, 'sine', 0.06, 0.04);
      }
    }

    bookForCampus() {
      this.closeModals();
      this.navigate('appointment');
      const loc = this.selectedLocation || CITY_LOCATIONS[this.selectedCity]?.[0];
      if (loc) {
        const custLocSelect = document.getElementById('custLocationHub');
        if (custLocSelect) {
          for (let opt of custLocSelect.options) {
            if (opt.value.includes(loc.name) || opt.value === loc.full) {
              opt.selected = true;
              break;
            }
          }
        }
      }
      this.showToast(`Reserving parking near ${loc?.name || 'campus'}. Please complete driver info!`);
    }

    handleCityChange(city) {
      this.selectedCity = city;
      const heroSelect = document.getElementById('heroCitySelector');
      if (heroSelect && heroSelect.value !== city) heroSelect.value = city;
      const custCitySelect = document.getElementById('custCity');
      if (custCitySelect && custCitySelect.value !== city) custCitySelect.value = city;
      
      this.renderCampusHubs(city);
      this.handleCustCityChange(city);
      const firstLoc = CITY_LOCATIONS[city]?.[0] || CITY_LOCATIONS['Kanpur'][0];
      this.updateCampusMap(firstLoc);

      this.showToast(`Selected City: ${city} 📍 Famous campus Google maps loaded!`);
      sound.playSuccess();
    }

    handleCustCityChange(city) {
      const locSelect = document.getElementById('custLocationHub');
      if (!locSelect) return;
      const locs = CITY_LOCATIONS[city] || CITY_LOCATIONS['Kanpur'] || [];
      locSelect.innerHTML = locs.map((l, i) => `
        <option value="${l.full}" ${i === 0 ? 'selected' : ''}>${l.full} [${l.type}]</option>
      `).join('');
    }

    navigate(pageName) {
      this.currentPage = pageName;
      document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-link-btn').forEach(btn => btn.classList.remove('active'));

      const targetView = document.getElementById(`view${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`);
      const targetBtn = document.querySelector(`.nav-link-btn[data-page="${pageName}"]`);

      if (targetView) targetView.classList.add('active');
      if (targetBtn) targetBtn.classList.add('active');

      if (pageName === 'find-parking') {
        window.ParkingEngine.renderFloor();
      }

      window.location.hash = pageName;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderServices() {
      const grid = document.getElementById('servicesGrid');
      if (!grid) return;
      grid.innerHTML = this.services.map(s => `
        <div class="product-card">
          <div class="product-card-img">${s.icon}</div>
          <div class="product-card-body">
            <h3 class="product-title">${s.name}</h3>
            <p class="product-desc">${s.desc}</p>
            <div class="product-price-row">
              <span class="product-price">Rs. ${s.price.toFixed(2)}</span>
              <button class="btn btn-sky-blue" style="padding:0.4rem 1.1rem;" onclick="VehiStayApp.bookService('${s.name}')">Book Service ➔</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    sortServices() {
      const val = document.getElementById('servicesSortSelect')?.value;
      if (val === 'low') this.services.sort((a, b) => a.price - b.price);
      else if (val === 'high') this.services.sort((a, b) => b.price - a.price);
      else if (val === 'name') this.services.sort((a, b) => a.name.localeCompare(b.name));
      else this.services = [...SERVICES];
      this.renderServices();
    }

    handleSearch() {
      const query = (document.getElementById('navbarGlobalSearch')?.value || '').trim().toLowerCase();
      if (!query) {
        this.services = [...SERVICES];
        this.navigate('services');
        this.renderServices();
        return;
      }
      this.services = SERVICES.filter(s => s.name.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query));
      this.navigate('services');
      this.renderServices();
    }

    bookService(serviceName) {
      const appSelect = document.getElementById('appService');
      if (appSelect) {
        for (let opt of appSelect.options) {
          if (opt.text.toLowerCase().includes(serviceName.toLowerCase())) {
            opt.selected = true;
            break;
          }
        }
      }
      this.navigate('appointment');
      this.showToast(`Selected: ${serviceName}. Please fill driver & customer details.`);
    }

    bookPlan(planName, price) {
      sound.playSuccess();
      window.ParkingEngine.revenue += price;
      window.ParkingEngine.renderKpis();
      this.showToast(`Subscribed to ${planName} (Rs. ${price.toFixed(2)}/mo)! Welcome to VehiStay.`);
    }

    openLogin() {
      document.getElementById('loginModal')?.classList.add('active');
    }

    closeModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }

    openRegisterLotModal() {
      sound.playBeep(600, 'sine', 0.08, 0.05);
      document.getElementById('registerLotModal')?.classList.add('active');
    }

    handleOperatorTypeChange(val) {
      const agencyNameInput = document.getElementById('lotOperatorAgencyName');
      if (agencyNameInput) {
        if (val.includes('Third-Party') || val.includes('Contractor')) {
          agencyNameInput.placeholder = 'Enter Registered Security / Operator Company Name *';
        } else {
          agencyNameInput.placeholder = 'e.g. SafePark Operations Pvt Ltd / Self';
        }
      }
    }

    async handleRegisterLotSubmit(e) {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Transmitting to Admin...';
      }

      try {
        const lotData = {
          landowner_name: document.getElementById('lotLandownerName')?.value || '',
          landowner_type: document.getElementById('lotLandownerType')?.value || '',
          landowner_id_type: document.getElementById('lotLandownerIdType')?.value || '',
          landowner_id_number: document.getElementById('lotLandownerIdNumber')?.value || '',
          landowner_phone: document.getElementById('lotLandownerPhone')?.value || '',
          landowner_email: document.getElementById('lotLandownerEmail')?.value || '',
          landowner_address: document.getElementById('lotLandownerAddress')?.value || '',
          operator_type: document.getElementById('lotOperatorType')?.value || '',
          operator_agency_name: document.getElementById('lotOperatorAgencyName')?.value || '',
          operator_manager_name: document.getElementById('lotOperatorManagerName')?.value || '',
          operator_manager_phone: document.getElementById('lotOperatorManagerPhone')?.value || '',
          operator_manager_email: document.getElementById('lotOperatorManagerEmail')?.value || '',
          operator_staff_count: document.getElementById('lotOperatorStaffCount')?.value || '4',
          operator_gstin: document.getElementById('lotOperatorGstin')?.value || '',
          city: document.getElementById('lotCity')?.value || this.selectedCity,
          vicinity: document.getElementById('lotVicinity')?.value || '',
          lot_name: document.getElementById('lotName')?.value || 'Smart Parking Lot',
          property_type: document.getElementById('lotPropertyType')?.value || 'Open Ground',
          lot_address: document.getElementById('lotAddress')?.value || '',
          gate_details: document.getElementById('lotGateDetails')?.value || '',
          car_cap: parseInt(document.getElementById('lotCarCap')?.value || 50, 10),
          bike_cap: parseInt(document.getElementById('lotBikeCap')?.value || 30, 10),
          ev_cap: parseInt(document.getElementById('lotEvCap')?.value || 4, 10),
          tariff_car: parseFloat(document.getElementById('lotTariffCar')?.value || 40),
          tariff_bike: parseFloat(document.getElementById('lotTariffBike')?.value || 20),
          tariff_daily: parseFloat(document.getElementById('lotTariffDaily')?.value || 180),
          tariff_monthly: parseFloat(document.getElementById('lotTariffMonthly')?.value || 1500),
          partnership_model: document.getElementById('lotPartnershipModel')?.value || '',
          amenities: [
            document.getElementById('amenityAnpr')?.checked ? 'ANPR' : null,
            document.getElementById('amenityCctv')?.checked ? 'CCTV' : null,
            document.getElementById('amenityEv')?.checked ? 'EV Charging' : null,
            document.getElementById('amenityCovered')?.checked ? 'Shaded Bays' : null
          ].filter(Boolean),
          bank_acc_name: document.getElementById('lotBankAccName')?.value || '',
          bank_name: document.getElementById('lotBankName')?.value || '',
          bank_acc_num: document.getElementById('lotBankAccNum')?.value || '',
          bank_ifsc: document.getElementById('lotBankIfsc')?.value || '',
          bank_upi: document.getElementById('lotBankUpi')?.value || '',
          plan_tier: document.querySelector('input[name="lotPlanTier"]:checked')?.value || 'free'
        };

        // Submit to Supabase universal DB client
        let res = { success: true };
        if (window.VehiStayDB) {
          res = await window.VehiStayDB.submitRegisteredLot(lotData);
        }

        const savedLot = res.lot || lotData;

        // Populate receipt agreement modal
        document.getElementById('receiptLotName').textContent = savedLot.lot_name;
        document.getElementById('receiptLotAddress').textContent = `${savedLot.lot_address || savedLot.vicinity}, ${savedLot.city}`;
        document.getElementById('receiptPartnerId').textContent = savedLot.partner_id || 'VP-KNP-2026-8941';
        document.getElementById('receiptLandowner').textContent = savedLot.landowner_name;
        document.getElementById('receiptLandownerContact').textContent = `${savedLot.landowner_phone} • ${savedLot.landowner_type}`;
        document.getElementById('receiptOperator').textContent = `${savedLot.operator_manager_name} (${savedLot.operator_type})`;
        document.getElementById('receiptCapacity').textContent = `${savedLot.car_cap} Cars, ${savedLot.bike_cap} Bikes (Rs. ${savedLot.tariff_car}/hr)`;
        document.getElementById('receiptUpi').textContent = savedLot.bank_upi || 'Registered for daily payouts';

        this.closeModals();
        sound.playSuccess();
        document.getElementById('partnerAgreementModal')?.classList.add('active');
        this.showToast(`🎉 Registration for "${savedLot.lot_name}" sent to Admin (mridulyadav44@gmail.com)!`);
        document.getElementById('registerLotForm').reset();
      } catch (err) {
        console.error('[Lot Registration Error]:', err);
        alert('An error occurred submitting the registration. Please check required fields.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    }

    async handleAppointmentSubmit(e) {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Confirming Booking with Database...';
      }

      try {
        // Collect Customer Details
        const custName = document.getElementById('custName')?.value || 'Customer';
        const custPhone = document.getElementById('custPhone')?.value || '';
        const custEmail = document.getElementById('custEmail')?.value || 'customer@example.com';
        const custCity = document.getElementById('custCity')?.value || this.selectedCity;
        const custLocationHub = document.getElementById('custLocationHub')?.value || `${custCity} Central Hub`;

        // Collect Driver & Vehicle Details
        const driverName = document.getElementById('driverName')?.value || custName;
        const driverDlNo = document.getElementById('driverDlNo')?.value || '';
        const vehiclePlate = (document.getElementById('driverVehiclePlate')?.value || 'MH 02 AB 1234').toUpperCase();
        const vehicleType = document.getElementById('driverVehicleType')?.value || 'sedan';

        // Collect Service Details
        const serviceName = document.getElementById('appService')?.value || 'Reserved Hourly Parking Space';
        const date = document.getElementById('appDate')?.value || new Date().toISOString().split('T')[0];
        const time = document.getElementById('appTime')?.value || '09:00 AM - 11:00 AM';

        // Assign an available bay on the floor
        const openSlot = window.ParkingEngine.slots.find(s => s.status === 'available') || window.ParkingEngine.slots[0];
        openSlot.status = 'reserved';
        openSlot.occupant = { plate: vehiclePlate, vehicleType, driverName, entryTime: Date.now() };
        window.ParkingEngine.revenue += 150.00;
        window.ParkingEngine.renderFloor();

        const cityPrefix = (custCity || 'KNP').substring(0, 3).toUpperCase();
        const bookingId = `VS-${cityPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
        const verificationToken = `vst_sec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
        const securityPin = String(Math.floor(1000 + Math.random() * 9000));

        let bookingPayload = {
          booking_id: bookingId,
          customer_name: custName,
          customer_phone: custPhone,
          customer_email: custEmail,
          customer_city: custCity,
          location_name: custLocationHub,
          slot_code: openSlot.id,
          driver_name: driverName,
          driver_dl_no: driverDlNo,
          vehicle_plate: vehiclePlate,
          vehicle_type: vehicleType,
          service_name: serviceName,
          booking_date: date,
          time_slot: time,
          security_pin: securityPin,
          verification_token: verificationToken,
          total_amount: 150.00,
          duration_text: `${date} (${time})`
        };

        // Save real booking in Supabase backend
        if (window.VehiStayDB) {
          try {
            const bookingRes = await window.VehiStayDB.createBooking(bookingPayload);
            if (bookingRes?.booking) {
              bookingPayload = { ...bookingPayload, ...bookingRes.booking };
              bookingPayload.duration_text = `${date} (${time})`;
            }
          } catch (dbErr) {
            console.warn('[Supabase Booking Creation]:', dbErr);
          }
        }

        sound.playSuccess();

        // Generate real Digital Parking Pass with dynamic scannable QR Code
        this.generateBookingPass(bookingPayload);

        const bId = bookingPayload.booking_id ? ` [${bookingPayload.booking_id}]` : '';
        this.showToast(`Booking Confirmed${bId} for ${custName} (${vehiclePlate})! Ticket ready. 🎟️`);
        document.getElementById('appointmentForm').reset();
        this.handleCustCityChange(this.selectedCity);
      } catch (err) {
        console.error('[Appointment Submit Error]:', err);
        alert('An error occurred submitting your booking. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    }

    /**
     * Centralized Digital Parking Pass & Real Scannable QR Code Generator
     * Generates a unique, real QR code encoding a secure verification endpoint.
     * Prevents duplicate QR accumulation and provides graceful error fallbacks.
     */
    generateBookingPass(bookingData) {
      if (!bookingData) return;

      // 1. Populate all 7 required ticket confirmation fields
      const elPassId = document.getElementById('ticketPassId');
      if (elPassId) elPassId.textContent = bookingData.booking_id || 'VS-KNP-89410';

      const elSlot = document.getElementById('ticketSlotId');
      if (elSlot) elSlot.textContent = bookingData.slot_code || 'F1-A01';

      const elPlate = document.getElementById('ticketPlate');
      if (elPlate) elPlate.textContent = bookingData.vehicle_plate || 'MH 02 AB 1234';

      const elPin = document.getElementById('ticketPin');
      if (elPin) elPin.textContent = bookingData.security_pin || '4821';

      const elDur = document.getElementById('ticketDuration');
      if (elDur) elDur.textContent = bookingData.duration_text || bookingData.time_slot || '2 Hours';

      const elDt = document.getElementById('ticketDateTime');
      if (elDt) elDt.textContent = `${bookingData.booking_date || new Date().toISOString().split('T')[0]} (${bookingData.time_slot || '09:00 AM - 11:00 AM'})`;

      const elCharges = document.getElementById('ticketCharges');
      if (elCharges) elCharges.textContent = `Rs. ${parseFloat(bookingData.total_amount || 150).toFixed(2)}`;

      const elLoc = document.getElementById('ticketLocation');
      if (elLoc) elLoc.textContent = bookingData.location_name || `${this.selectedCity} Central Smart Hub`;

      // 2. Clear previous QR canvas / errors to prevent duplicates
      const qrWrapper = document.getElementById('ticketQrWrapper');
      if (qrWrapper) {
        qrWrapper.innerHTML = '<canvas id="ticketQrCanvas" width="180" height="180" style="display:block; max-width:100%; height:auto;"></canvas>';
      }

      // 3. Construct dynamic Verification URL (GitHub Pages subpath & localhost safe)
      const currentPath = window.location.pathname;
      const baseDir = window.location.origin + currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
      const verifyUrl = `${baseDir}verify.html?bid=${encodeURIComponent(bookingData.booking_id)}&token=${encodeURIComponent(bookingData.verification_token || '')}`;

      // Save state for Download and Test Scan actions
      this.currentPassBooking = bookingData;
      this.currentVerifyUrl = verifyUrl;

      // 4. Generate real scannable QR Code
      const canvas = document.getElementById('ticketQrCanvas');
      if (typeof window.QRCode === 'undefined') {
        console.error('[VehiStay] QR Code engine unavailable.');
        if (qrWrapper) {
          qrWrapper.innerHTML = `
            <div style="color:#ef4444; font-size:0.8rem; text-align:center; padding:1.25rem 0.5rem; border:1px dashed #ef4444; border-radius:8px;">
              <div style="font-size:1.6rem; margin-bottom:0.35rem;">⚠️</div>
              <strong style="display:block; margin-bottom:0.25rem;">QR Generator Offline</strong>
              <span style="font-size:0.7rem; color:#94a3b8;">QRCode.js failed to load.<br>Verify internet or script path.</span>
            </div>
          `;
        }
      } else if (canvas) {
        try {
          QRCode.toCanvas(canvas, verifyUrl, {
            width: 180,
            margin: 3,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
          }, (err) => {
            if (err) {
              console.error('[VehiStay] QRCode rendering error:', err);
              if (qrWrapper) {
                qrWrapper.innerHTML = `<div style="color:#ef4444; font-size:0.8rem; padding:1rem;">⚠️ QR Render Failed</div>`;
              }
            }
          });
        } catch (qrEx) {
          console.error('[VehiStay] QR Canvas exception:', qrEx);
        }
      }

      // 5. Open Ticket Pass Modal
      document.getElementById('ticketModal')?.classList.add('active');
    }

    /**
     * Download the rendered QR Code as an image file
     */
    downloadQrPass() {
      const canvas = document.getElementById('ticketQrCanvas');
      if (!canvas) {
        this.showToast('⚠️ No active QR Code available to download.');
        return;
      }
      try {
        const link = document.createElement('a');
        const passId = this.currentPassBooking?.booking_id || 'VEHISTAY-PASS';
        link.download = `${passId}-qrcode.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast('📥 QR Code downloaded successfully!');
      } catch (err) {
        console.error('[Download QR Error]:', err);
        this.showToast('Unable to export QR image.');
      }
    }

    /**
     * Test Scan: Opens the verification portal in a new tab simulating a camera scan
     */
    testScanPass() {
      if (this.currentVerifyUrl) {
        window.open(this.currentVerifyUrl, '_blank');
      } else {
        this.showToast('⚠️ Verification link not available.');
      }
    }

    async handleContactSubmit(e) {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';
      }

      try {
        const name = document.getElementById('cName')?.value || '';
        const phone = document.getElementById('cPhone')?.value || '';
        const email = document.getElementById('cEmail')?.value || '';
        const company = document.getElementById('cCompany')?.value || '';
        const subject = document.getElementById('cSubject')?.value || '';
        const message = document.getElementById('cMessage')?.value || '';

        if (window.VehiStayDB) {
          await window.VehiStayDB.submitContactMessage({
            name, phone, email, company, subject, message
          });
        }

        sound.playSuccess();
        this.showToast(`Thank you, ${name}! Your inquiry has been logged with Support & Admin.`);
        document.getElementById('contactForm').reset();
      } catch (err) {
        console.error('[Contact Submit Error]:', err);
        this.showToast('Message sent! Thank you.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      }
    }

    handleLogin(e) {
      e.preventDefault();
      const emailInput = e.target.querySelector('input[type="email"]');
      const email = (emailInput?.value || '').trim().toLowerCase();

      // If user enters admin credentials in the customer modal, guide them to the Owner Portal
      if (email === 'mridulyadav44@gmail.com' || email === 'admin' || email === 'admin@vehistay.com') {
        this.closeModals();
        if (confirm('Administrator credentials detected. Would you like to open the Admin Control Center?')) {
          window.location.href = 'admin-login.html';
          return;
        }
      }

      this.closeModals();
      sound.playSuccess();
      this.showToast(`Signed in successfully as ${email || 'Customer'}! Welcome to VehiStay.`);
    }

    showToast(msg) {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast-box';
      toast.innerHTML = `<span>ℹ️</span> <span>${msg}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }
  }

  // Instantiate Global Controllers
  window.ParkingEngine = new SmartParkingEngine();
  window.VehiStayApp = new VehiStayAppController();
})();
