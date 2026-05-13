export type CVStatus = 'Draft' | 'Completed';

export type CVRecord = {
  id: string;
  title: string;
  template: string;
  status: CVStatus;
  lastUpdated: string;
  downloads: number;
};

export type TemplateRecord = {
  id: string;
  name: string;
  category: 'Student' | 'Fresh Graduate' | 'Professional';
  tags: string[];
  active: boolean;
  image: string;
};

export const userName = 'Mahbub';

export const recentCVs: CVRecord[] = [
  {
    id: 'software-engineer',
    title: 'My Software Engineer CV',
    template: 'Executive Modern v2.1',
    status: 'Completed',
    lastUpdated: 'Today, 10:30 AM',
    downloads: 3,
  },
  {
    id: 'fresh-graduate',
    title: 'Fresh Graduate CV',
    template: 'Clean Entry Pro',
    status: 'Draft',
    lastUpdated: 'Yesterday, 8:12 PM',
    downloads: 0,
  },
  {
    id: 'student-internship',
    title: 'Internship Application CV',
    template: 'Student Simple CV',
    status: 'Completed',
    lastUpdated: 'Apr 28, 2026',
    downloads: 2,
  },
];

export const templates: TemplateRecord[] = [
  {
    id: 'student-simple',
    name: 'Student Simple CV',
    category: 'Student',
    tags: ['Simple', 'ATS Friendly', 'Without Photo'],
    active: true,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 'internship-clean',
    name: 'Internship Clean',
    category: 'Student',
    tags: ['One Page', 'Simple', 'With Photo'],
    active: true,
    image: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 'clean-entry-pro',
    name: 'Clean Entry Pro',
    category: 'Fresh Graduate',
    tags: ['Modern', 'ATS Friendly', 'One Page'],
    active: true,
    image: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 'graduate-modern',
    name: 'Graduate Modern',
    category: 'Fresh Graduate',
    tags: ['Modern', 'With Photo'],
    active: true,
    image: 'https://images.unsplash.com/photo-1544650030-3c9b120c729b?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 'executive-modern',
    name: 'Executive Modern v2.1',
    category: 'Professional',
    tags: ['Professional', 'Two Pages', 'ATS Friendly'],
    active: true,
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Professional',
    tags: ['Corporate', 'Without Photo'],
    active: true,
    image: 'https://images.unsplash.com/photo-1522071823991-b9671f9d7f1f?auto=format&fit=crop&q=80&w=500',
  },
];

export const sampleProfile = {
  fullName: 'Mahbub Rahman',
  email: 'mahbub@example.com',
  userType: 'Fresh Graduate',
};
