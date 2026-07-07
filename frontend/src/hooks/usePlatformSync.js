import { useState, useCallback } from 'react';

const mockPlatformProjects = [
  {
    name: 'Career Guide AI',
    description: 'Developed an AI-powered career assistant using multi-agent systems and React.',
    tech: ['React', 'FastAPI', 'Python', 'OpenAI'],
    role: 'Full Stack Developer',
    completion_date: 'June 2026',
    github: 'https://github.com/example/career-guide',
    live_demo: 'https://career-guide.example.com',
    hidden: false
  },
  {
    name: 'E-commerce Platform',
    description: 'Built a scalable e-commerce backend with microservices architecture.',
    tech: ['Node.js', 'Express', 'MongoDB', 'Docker'],
    role: 'Backend Engineer',
    completion_date: 'March 2025',
    github: 'https://github.com/example/ecommerce-api',
    hidden: false
  },
  {
    name: 'Portfolio Website',
    description: 'Personal portfolio website showcasing projects and skills.',
    tech: ['HTML', 'CSS', 'JavaScript'],
    role: 'Frontend Developer',
    completion_date: 'January 2024',
    live_demo: 'https://myportfolio.example.com',
    hidden: false
  }
];

const mockPlatformAchievements = [
  {
    title: 'Global Hackathon Winner',
    description: '1st place out of 500+ teams in the AI innovation track.',
    date: '2025',
    type: 'Hackathon',
    hidden: false
  },
  {
    title: 'AWS Certified Cloud Practitioner',
    description: 'Achieved fundamental cloud certification.',
    date: '2024',
    type: 'Certification',
    hidden: false
  },
  {
    title: 'Top 1% on Leaderboard',
    description: 'Reached top 1% rank in algorithmic coding challenges.',
    date: '2026',
    type: 'Skill Milestone',
    hidden: false
  }
];

export function usePlatformSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchPlatformData = useCallback(async () => {
    setSyncing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSyncing(false);
    setLastSynced(new Date().toISOString());

    return {
      projects: JSON.parse(JSON.stringify(mockPlatformProjects)),
      achievements: JSON.parse(JSON.stringify(mockPlatformAchievements))
    };
  }, []);

  return {
    syncing,
    lastSynced,
    fetchPlatformData
  };
}
