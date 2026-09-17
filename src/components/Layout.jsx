import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '../public/logo.png';

const links = [
  ['/', 'grid-1x2', 'Overview'], ['students', 'people', 'Students'], ['attendance', 'check2-square', 'Attendance'], ['subjects', 'book', 'Subjects'], ['years', 'layers', 'Year master'], ['semesters', 'calendar3', 'Semester master'], ['faculty', 'person-badge', 'Faculty'], ['reports', 'bar-chart-line', 'Reports'], ['settings', 'gear', 'Settings']
];
export default function Layout({ user, onLogout }) {
  const navigate = useNavigate();
  const visibleLinks = links.filter(([to]) => user?.role === 'admin' || !['/years', 'years', 'semesters', 'subjects', 'faculty'].includes(to));
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><img src={logo} alt="BCA Department logo" /><span>BCA DEPARTMENT</span></div><div className="workspace-label">WORKSPACE</div><nav>{visibleLinks.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><i className={`bi bi-${icon}`} />{label}</NavLink>)}</nav><div className="sidebar-bottom"><div className="profile"><div className="avatar">{user?.name?.[0] || 'A'}</div><div><strong>{user?.name || 'Admin User'}</strong><small>{user?.role || 'admin'}</small></div></div><button className="logout" onClick={() => { localStorage.clear(); onLogout(); navigate('/login'); }}><i className="bi bi-box-arrow-right" /> Sign out</button></div></aside><main className="main-content"><header className="topbar"><div><span className="eyebrow">ACADEMIC OPERATIONS</span><h1>Attendance command center</h1></div><div className="top-actions"><span className="live-dot" /> Live system <button className="icon-button"><i className="bi bi-bell" /></button></div></header><div className="page-content"><Outlet /></div></main></div>;
}
