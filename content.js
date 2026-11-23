const projectData = {
  skillsphere: {
    label: '01 / FULL-STACK WEB APPLICATION', name: 'SkillSphere', intro: 'Student collaboration, built end to end.',
    overview: 'A skill-exchange platform where students can build profiles, showcase projects, explore learning roadmaps, join communities, and send collaboration requests.',
    decisions: ['Java 21 and Spring Boot backend, with a React frontend and MySQL data layer.', 'JWT and Google OAuth2 authentication, BCrypt password hashing, and role-based access with Spring Security.', 'A controller → service → repository structure, request validation, and OpenAPI documentation.'],
    focus: 'Bringing identity, community, and learning features together while keeping responsibilities clear across the application.',
    links: [{ label: 'Open live app', url: 'https://skillsphere-tidb-utkarshk08.vercel.app' }, { label: 'Explore the source', url: 'https://github.com/utkarshk08/SkillSphere' }],
    note: 'The interactive preview on this portfolio is a small interface study, not an embedded version of the live application.'
  },
  cutroom: {
    label: '02 / CREATIVE TOOL · JAVA EDITION', name: 'CutRoom', intro: 'A hands-on studio for getting ideas onto the wall.',
    overview: 'An interactive wall-layout editor for arranging photos and text on a measured wall, cropping poster sheets, and preparing printable pages.',
    decisions: ['React frontend with resize, rotate, grouping, layers, and JSON backup features.', 'Spring Boot REST APIs and JWT authentication, with owner-scoped project persistence in MySQL.', 'In this Java edition, image data is embedded in saved project JSON; it does not use a separate image storage service.'],
    focus: 'Connecting a direct-manipulation interface to secure project storage, while making creative layouts editable and recoverable.',
    links: [{ label: 'Live app · original edition', url: 'https://cutroom.utkarshk0804.workers.dev' }, { label: 'Java edition source', url: 'https://github.com/utkarshk08/cutroom-java' }, { label: 'Original edition source', url: 'https://github.com/utkarshk08/CutRoom' }],
    note: 'The live app is the original TypeScript edition. The project details here describe the separate Java/Spring Boot edition. The wall preview is an interactive portfolio concept, not the complete editor.'
  }
};
Object.assign(projectData, {
  expense: {
    label: '03 / PERSONAL TOOL · DATA VISUALIZATION', name: 'Expense Trackr', intro: 'A clearer view of where the everyday goes.',
    overview: 'A mobile-friendly, read-only dashboard for an existing Google Sheets expense ledger. It brings transaction search, category breakdowns, and daily spending insights into a dedicated interface.',
    decisions: ['Google Apps Script reads the ledger through the Google Sheets API with a read-only scope.', 'Vanilla JavaScript, HTML, and CSS provide date, category, and payment filters, category donut and ranked views, and tappable daily details.', 'Manual refresh preserves the current filters. Transactions render in batches of 30, with mobile layouts and reduced-motion support.'],
    focus: 'Turning a practical personal workflow into a responsive, readable dashboard while keeping the source ledger unchanged.',
    links: [{ label: 'Open dashboard · Google sign-in', url: 'https://script.google.com/macros/s/AKfycbz7k0YoP2P3kUcXVX2nG6OhaJ1yNJ2j6NoKD_mFzWH4bxeBT0ua_R_pfRE7K1mZ43TzEw/exec' }, { label: 'Explore the source', url: 'https://github.com/utkarshk08/expense-trackr' }],
    note: 'Google sign-in is required for the live dashboard. This app reads expenses; the iPhone Shortcut used for entry is a separate workflow. The portfolio preview uses invented sample transactions and never connects to a real ledger.'
  },
  vitatrackr: {
    label: '04 / HEALTH & WELLNESS APPLICATION', name: 'VitaTrackr', intro: 'Everyday habits, in one place.',
    overview: 'A wellness project with recipe generation, meal and activity logging, personal profiles, and an overview dashboard.',
    decisions: ['Node.js and Express backend with MongoDB models and routes for users, meals, activities, recipes, and weight logs.', 'Google Gemini integration for recipe generation and ingredient-based ideas.', 'JavaScript interface with IndexedDB and local storage support for browser-side data.'],
    focus: 'Connecting multiple everyday tracking flows with a common profile and making external AI services part of a usable application.',
    links: [{label:'Explore the source',url:'https://github.com/utkarshk08/vita-trackr'}],
    note: 'A software portfolio project. AI-generated wellness content is not a clinical recommendation.'
  },
  gamestore: {
    label: '05 / E-COMMERCE LEARNING PROJECT', name: 'GameStore', intro: 'A game catalog with systems behind it.',
    overview: 'A digital storefront demonstration featuring game discovery, user profiles, virtual wallet purchases, subscription plans, and store analytics.',
    decisions: ['Spring Boot and Spring Data MongoDB backend, with a vanilla JavaScript interface.', 'Separate domain models for games, purchases, subscriptions, and user profiles.', 'REST endpoints for catalog search, purchase history, subscriptions, and aggregate store statistics.'],
    focus: 'Modeling connected commerce workflows and querying document data for useful aggregate views.',
    links: [{label:'Explore the source',url:'https://github.com/utkarshk08/gaminglol'}],
    note: 'A learning project with simulated wallet and purchase flows, not a production payment service.'
  }
});
