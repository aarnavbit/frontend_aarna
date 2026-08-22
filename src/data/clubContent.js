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

