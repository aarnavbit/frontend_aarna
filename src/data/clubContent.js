/**
 * Curated AARNA copy and portfolio metadata sourced from the supplied club brief.
 * Single source of truth for portfolio definitions, team details, and club objectives.
 */

/**
 * @typedef {Object} Portfolio
 * @property {string} name - Full team name
 * @property {string} eyebrow - Short action kicker / eyebrow text
 * @property {string} description - Team description
 * @property {string} [short] - Abbreviated team label
 * @property {string} [desc] - Alias for description
 * @property {string} [domain] - Primary technical / operational domain
 * @property {string[]} [tools] - Key tools and platforms used
 * @property {string} [eligibility] - Eligibility criteria
 * @property {string} [interviewFocus] - What interviewers assess
 * @property {string} [badge] - Badge label
 * @property {string} [color] - Accent color theme
 */

/** @type {Portfolio[]} */
export const portfolios = [
  {
    name: 'Technical team',
    eyebrow: 'Build',
    short: 'Tech',
    desc: 'Shape the tools, websites, and systems that support AARNA projects.',
    description: 'Shape the tools, websites, and systems that support AARNA projects.',
    domain: 'Software Engineering & Web Systems',
    tools: ['React', 'Node.js', 'Vite', 'FastAPI', 'Git', 'Cloud Platforms'],
    eligibility: '1st, 2nd & 3rd Year B.Tech Students',
    interviewFocus: 'Problem solving, web fundamentals, projects & willingness to learn',
    badge: 'Core Engineering',
    color: '#3b82f6',
    lead: {
      name: 'Aarav Sharma',
      role: 'Team Lead & Tech Architect',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Priya Nair',
        role: 'Full Stack Developer',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Karthik Verma',
        role: 'Backend Systems Lead',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Ananya Rao',
        role: 'Frontend & UI Engineer',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Rohan Joshi',
        role: 'DevOps & Cloud Engineer',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Sneha Gupta',
        role: 'Mobile App Engineer',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
  {
    name: 'Production team',
    eyebrow: 'Make',
    short: 'Production',
    desc: 'Turn ambitious event ideas into polished, memorable on-ground experiences.',
    description: 'Turn ambitious event ideas into polished, memorable on-ground experiences.',
    domain: 'Event Management & Logistics',
    tools: ['Stage Management', 'Live Audio/Visual', 'Logistics Planning'],
    eligibility: 'All Engineering Years & Branches',
    interviewFocus: 'Resourcefulness, stage presence, crisis handling & team execution',
    badge: 'On-Ground Operations',
    color: '#10b981',
    lead: {
      name: 'Devendra Patil',
      role: 'Team Lead & Operations',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      github: '',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Meera Kulkarni',
        role: 'Stage & Floor Manager',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Arjun Deshmukh',
        role: 'Live Sound & AV Engineer',
        photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Tanvi Shah',
        role: 'Logistics Coordinator',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Varun Bhat',
        role: 'Equipment & Floor Tech',
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
  {
    name: 'Designing team',
    eyebrow: 'Visualise',
    short: 'Design',
    desc: 'Create the visual identity that makes every AARNA story instantly recognisable.',
    description: 'Create the visual identity that makes every AARNA story instantly recognisable.',
    domain: 'UI/UX, Graphic Design & Motion Art',
    tools: ['Figma', 'Photoshop', 'Illustrator', 'After Effects', 'Blender'],
    eligibility: 'All Students passionate about visual craft',
    interviewFocus: 'Visual composition, design portfolio, aesthetic sense & typography',
    badge: 'Creative Identity',
    color: '#ec4899',
    lead: {
      name: 'Ishita Sen',
      role: 'Team Lead & Creative Director',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Aditya Saxena',
        role: 'UI/UX & Design Systems',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Rhea Kapoor',
        role: 'Motion & 3D Artist',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Kabir Mehta',
        role: 'Brand & Visual Identity',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Sanya Mir',
        role: 'Digital Illustrator',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
  {
    name: 'Documentation team',
    eyebrow: 'Tell',
    short: 'Docs',
    desc: 'Capture ideas, stories, and outcomes with clarity, care, and creative direction.',
    description: 'Capture ideas, stories, and outcomes with clarity, care, and creative direction.',
    domain: 'Content Writing, Journalism & Archival',
    tools: ['Markdown', 'Notion', 'Copywriting', 'Report Design', 'Scriptwriting'],
    eligibility: 'All Students with strong written expression',
    interviewFocus: 'Writing quality, storytelling, attention to detail & editorial voice',
    badge: 'Editorial & Archival',
    color: '#8b5cf6',
    lead: {
      name: 'Siddharth Menon',
      role: 'Team Lead & Chief Editor',
      photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Divya Reddy',
        role: 'Senior Copywriter & Archivist',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Manish Paul',
        role: 'Technical Writer & Reporter',
        photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Pooja Hegde',
        role: 'Content & Scriptwriter',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Vikram Malhotra',
        role: 'Editorial & Research',
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
  {
    name: 'Social Media & Promotion team',
    eyebrow: 'Amplify',
    short: 'Social',
    desc: 'Bring campaigns to life and grow a community around meaningful student work.',
    description: 'Bring campaigns to life and grow a community around meaningful student work.',
    domain: 'Digital Growth, Campaigns & Content Strategy',
    tools: ['Instagram Insights', 'Canva', 'CapCut', 'Content Calendars', 'Reels'],
    eligibility: 'All Students active in digital communities',
    interviewFocus: 'Trend awareness, engagement strategies & campaign ideation',
    badge: 'Audience Growth',
    color: '#f59e0b',
    lead: {
      name: 'Zara Khan',
      role: 'Team Lead & Growth Strategist',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      github: '',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Ayush Trivedi',
        role: 'Campaign Director',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Kavya Iyer',
        role: 'Reels & Short-Form Lead',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Nikhil Bansal',
        role: 'Analytics & Community',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Tara Sen',
        role: 'Public Relations Specialist',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
  {
    name: 'Hospitality team',
    eyebrow: 'Welcome',
    short: 'Hospitality',
    desc: 'Design thoughtful participant and guest experiences for every club moment.',
    description: 'Design thoughtful participant and guest experiences for every club moment.',
    domain: 'Guest Relations, Protocol & Experience Design',
    tools: ['Guest Protocols', 'Event Coordination', 'VIP Handling'],
    eligibility: 'All Students with strong interpersonal communication',
    interviewFocus: 'Communication etiquette, conflict resolution & hospitality instincts',
    badge: 'Guest Relations',
    color: '#14b8a6',
    lead: {
      name: 'Ritika Chawla',
      role: 'Team Lead & Protocol Head',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      github: '',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Sameer Sheikh',
        role: 'VIP Escort & Dignitary Lead',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Bhavna Pillai',
        role: 'Delegate Coordinator',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Gaurav Sen',
        role: 'Venue Flow Supervisor',
        photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Simran Kaur',
        role: 'Guest Experience Concierge',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
  {
    name: 'Marketing & Sponsorship team',
    eyebrow: 'Connect',
    short: 'Marketing',
    desc: 'Build relationships, find opportunities, and help AARNA’s work travel further.',
    description: 'Build relationships, find opportunities, and help AARNA’s work travel further.',
    domain: 'Corporate Relations & Sponsorship Outreach',
    tools: ['Pitch Decks', 'CRM', 'Cold Outreach', 'Negotiation Strategies'],
    eligibility: 'All Students with interest in partnerships & marketing',
    interviewFocus: 'Pitch delivery, negotiation skills, confidence & professional outreach',
    badge: 'Industry Alliances',
    color: '#e11d48',
    lead: {
      name: 'Kunal Singhania',
      role: 'Team Lead & Alliances Head',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      github: '',
      linkedin: 'https://linkedin.com',
    },
    members: [
      {
        name: 'Akash Roy',
        role: 'Corporate Outreach Lead',
        photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Neha Joshi',
        role: 'Sponsorship Strategist',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Rahul Bajaj',
        role: 'Brand Partnership Associate',
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
      {
        name: 'Diya Mathur',
        role: 'Financial Planning & CRM',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        linkedin: 'https://linkedin.com',
      },
    ],
  },
]

/**
 * AARNA's core club objectives presented across public experiences.
 * @type {string[]}
 */
export const objectives = [
  'Identify talents and transform them into profitable ventures.',
  'Sharpen both technical and non-technical skill sets.',
  'Build meaningful connections with clients and professionals.',
  'Create portfolios that open doors to new opportunities.',
]

