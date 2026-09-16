import { useEffect, useState } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import { Table, Loading, Empty, Toast } from '../components/UI';

const configs = {
  years: { title: 'Year master', singular: 'year', fields: [['name', 'Year name']], headers: ['Year name', 'Status'] },
  semesters: { title: 'Semester master', singular: 'semester', fields: [['name', 'Semester name']], headers: ['Semester name', 'Year', 'Status'] },
  subjects: { title: 'Subject master', singular: 'subject', fields: [['code', 'Subject code'], ['name', 'Subject name'], ['facultyName', 'Faculty name']], headers: ['Code', 'Subject', 'Faculty', 'Year', 'Semester', 'Type', 'Status'] },
  students: { title: 'Student management', singular: 'student', fields: [['name', 'Student name'], ['crNo', 'CR number']], headers: ['CR No.', 'Student', 'Year', 'Semester', 'Status'] }
};

export default function MasterPage({ type }) {
  const config = configs[type];
  const [items, setItems] = useState([]); const [years, setYears] = useState([]); const [semesters, setSemesters] = useState([]);
  const [form, setForm] = useState({}); const [editing, setEditing] = useState(null); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const modalId = 'recordModal';
  const cleanupModal = () => {
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  };
  const closeModal = () => {
    const modalElement = document.getElementById(modalId);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (!modalElement) return;
    modalElement.addEventListener('hidden.bs.modal', cleanupModal, { once: true });
    Modal.getOrCreateInstance(modalElement).hide();
    window.setTimeout(cleanupModal, 400);
  };
  const load = () => { setLoading(true); Promise.all([api.get(`/${type}?search=${encodeURIComponent(search)}`), api.get('/years'), api.get('/semesters')]).then(([list, yrs, sems]) => { setItems(list.data); setYears(yrs.data); setSemesters(sems.data); }).catch((e) => setError(e.response?.data?.message || 'Could not load records')).finally(() => setLoading(false)); };
  useEffect(load, [type, search]);
  useEffect(() => {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return undefined;
    modalElement.addEventListener('hidden.bs.modal', cleanupModal);
    return () => modalElement.removeEventListener('hidden.bs.modal', cleanupModal);
  }, []);
  const formValue = (value) => value?._id || value || '';
  const editRecord = (item) => { setEditing(item); setForm({ ...item, yearId: formValue(item.yearId), semesterId: formValue(item.semesterId) }); };
  const save = async (event) => { event.preventDefault(); setError(''); try { const payload = { ...form }; if (type === 'semesters' && !payload.yearId) throw new Error('Select a year'); if (type === 'subjects' && (!payload.yearId || !payload.semesterId)) throw new Error('Select year and semester'); if (type === 'students' && (!payload.yearId || !payload.semesterId)) throw new Error('Select year and semester'); if (editing) await api.put(`/${type}/${editing._id}`, payload); else await api.post(`/${type}`, payload); closeModal(); setForm({}); setEditing(null); setMessage(`${config.singular} saved successfully`); load(); } catch (saveError) { setError(saveError.response?.data?.message || saveError.message || 'Could not save record'); } };
  const remove = async (id) => { if (!confirm('Delete this record?')) return; try { await api.delete(`/${type}/${id}`); setMessage('Record deleted'); load(); } catch (removeError) { setError(removeError.response?.data?.message || 'Delete failed'); } };
  const display = (item, key) => item[key]?.name || item[key] || '—';
  const openNew = () => { setEditing(null); setForm({}); };
  return <><div className="page-title"><div><span className="eyebrow">CONFIGURATION</span><h2>{config.title}</h2><p className="muted">Manage the academic records used throughout attendance.</p></div><button className="primary-button" onClick={openNew} data-bs-toggle="modal" data-bs-target={`#${modalId}`}><i className="bi bi-plus-lg" /> Add {config.singular}</button></div><Toast message={message} error={!!error} /><div className="toolbar"><div className="search-box"><i className="bi bi-search" /><input placeholder={`Search ${config.singular}s...`} value={search} onChange={(event) => setSearch(event.target.value)} /></div><span className="record-count">{items.length} records</span></div>{loading ? <Loading /> : items.length ? <section className="panel"><Table headers={config.headers.concat('Actions')}>{items.map((item) => <tr key={item._id}>{type === 'years' && <><td><strong>{item.name}</strong></td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}{type === 'semesters' && <><td><strong>{item.name}</strong></td><td>{display(item, 'yearId')}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}{type === 'subjects' && <><td><strong>{item.code}</strong></td><td>{item.name}</td><td>{display(item, 'yearId')}</td><td>{display(item, 'semesterId')}</td><td>{item.type}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}{type === 'students' && <><td><strong>{item.crNo}</strong></td><td>{item.name}</td><td>{display(item, 'yearId')}</td><td>{display(item, 'semesterId')}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}<td><button className="table-action" onClick={() => editRecord(item)} data-bs-toggle="modal" data-bs-target={`#${modalId}`}><i className="bi bi-pencil" /></button><button className="table-action danger" onClick={() => remove(item._id)}><i className="bi bi-trash3" /></button></td></tr>)}</Table></section> : <section className="panel"><Empty text={`No ${config.singular}s yet.`} /></section>}<div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby="recordModalTitle"><div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h3 id="recordModalTitle">{editing ? 'Edit' : 'Add'} {config.singular}</h3><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" /></div><form onSubmit={save}><div className="modal-body">{config.fields.map(([key, label]) => <label key={key}>{label}<input value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required /></label>)}{(type === 'semesters' || type === 'subjects' || type === 'students') && <label>Year<select value={form.yearId || ''} onChange={(event) => setForm({ ...form, yearId: event.target.value })} required><option value="">Select year</option>{years.map((year) => <option key={year._id} value={year._id}>{year.name}</option>)}</select></label>}{(type === 'subjects' || type === 'students') && <label>Semester<select value={form.semesterId || ''} onChange={(event) => setForm({ ...form, semesterId: event.target.value })} required><option value="">Select semester</option>{semesters.filter((semester) => !form.yearId || (semester.yearId?._id || semester.yearId) === form.yearId).map((semester) => <option key={semester._id} value={semester._id}>{semester.name}</option>)}</select></label>}{type === 'subjects' && <label>Subject type<select value={form.type || 'Theory'} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Theory</option><option>Practical</option></select></label>}</div><div className="modal-footer"><button type="button" className="secondary-button" data-bs-dismiss="modal">Cancel</button><button type="submit" className="primary-button">Save record</button></div></form></div></div></div></>;
}
