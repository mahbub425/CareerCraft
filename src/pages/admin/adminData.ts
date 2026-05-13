import { recentCVs, templates } from '../user/mockUserData';

export const adminName = 'Admin Mahbub';

export const adminUsers = [
  { id: 'u1', name: 'Mahbub Rahman', email: 'mahbub@example.com', userType: 'Fresh Graduate', role: 'Admin', status: 'Active', totalCVs: 3, joined: 'May 1, 2026' },
  { id: 'u2', name: 'Nadia Akter', email: 'nadia@example.com', userType: 'Student', role: 'User', status: 'Active', totalCVs: 1, joined: 'May 2, 2026' },
  { id: 'u3', name: 'Samiul Islam', email: 'samiul@example.com', userType: 'Professional', role: 'User', status: 'Inactive', totalCVs: 2, joined: 'Apr 26, 2026' },
  { id: 'u4', name: 'Tania Ahmed', email: 'tania@example.com', userType: 'Fresh Graduate', role: 'User', status: 'Active', totalCVs: 0, joined: 'Apr 20, 2026' },
];

export const adminCategories = [
  { id: 'student', name: 'Student', description: 'Academic and internship CV templates.', status: 'Active', templatesCount: 2, default: true },
  { id: 'fresh-graduate', name: 'Fresh Graduate', description: 'Entry-level professional CV templates.', status: 'Active', templatesCount: 2, default: true },
  { id: 'professional', name: 'Professional', description: 'Experienced and corporate CV templates.', status: 'Active', templatesCount: 2, default: true },
];

export const cvActivity = recentCVs.map((cv, index) => ({
  ...cv,
  userName: adminUsers[index % adminUsers.length].name,
  userEmail: adminUsers[index % adminUsers.length].email,
  pdfDownloads: cv.downloads,
  docxDownloads: Math.max(0, cv.downloads - 1),
  created: 'Apr 25, 2026',
  updated: cv.lastUpdated,
}));

export const recentActivity = [
  'Nadia Akter registered a new account',
  'Mahbub Rahman downloaded My Software Engineer CV as PDF',
  'Executive Modern v2.1 template was updated',
  'Fresh Graduate CV was saved as draft',
];

export const adminTemplates = templates;
