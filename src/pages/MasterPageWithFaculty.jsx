import { useEffect, useState } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import { Empty, Loading, Pagination, Table, Toast } from '../components/UI';

const DEFAULT_PAGE_SIZE = 25;
const configs = {
  years: { title: 'Year master', singular: 'year', fields: [['name', 'Year name']], headers: ['Year name', 'Status'] },
  semesters: { title: 'Semester master', singular: 'semester', fields: [['name', 'Semester name']], headers: ['Semester name', 'Year', 'Status'] },
  subjects: { title: 'Subject master', singular: 'subject', fields: [['code', 'Subject code'], ['name', 'Subject name'], ['courseName', 'Course'], ['batchName', 'Batch / lab group']], headers: ['Code', 'Subject', 'Batch', 'Faculty', 'Year', 'Semester', 'Type', 'Status'] },
  students: { title: 'Student management', singular: 'student', fields: [['name', 'Student name'], ['crNo', 'CR number']], headers: ['CR No.', 'Student', 'Year', 'Semester', 'Status'] }
};

export default function MasterPageWithFaculty({ type }) {
  const config = configs[type];
  const [items, setItems] = useState([]); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [years, setYears] = useState([]); const [semesters, setSemesters] = useState([]); const [faculty, setFaculty] = useState([]); const [form, setForm] = useState({}); const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const modalId = `recordModal-${type}`;
  const clearFeedback = () => { setMessage(''); setError(''); };
  const loadLookups = async () => { try { const requests = [api.get('/years'), api.get('/semesters')]; if (type === 'subjects') requests.push(api.get('/faculty')); const [yearList, semesterList, facultyList] = await Promise.all(requests); setYears(yearList.data); setSemesters(semesterList.data); setFaculty(facultyList?.data || []); } catch (loadError) { setError(loadError.response?.data?.message || 'Could not load lookup data'); } };
  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/${type}`, { params: { search, page, pageSize } }); const result = Array.isArray(data) ? { items: data.slice((page - 1) * pageSize, page * pageSize), total: data.length, totalPages: Math.max(Math.ceil(data.length / pageSize), 1) } : data; setItems(result.items || []); setTotal(result.total || 0); setTotalPages(result.totalPages || 1); }
    catch (loadError) { setError(loadError.response?.data?.message || 'Could not load records'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [type, search, page, pageSize]);
  const cleanupModal = () => { document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove()); document.body.classList.remove('modal-open'); document.body.style.removeProperty('overflow'); document.body.style.removeProperty('padding-right'); };
  const closeModal = () => { const element = document.getElementById(modalId); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); if (element) { Modal.getOrCreateInstance(element).hide(); } cleanupModal(); window.setTimeout(cleanupModal, 500); };
  useEffect(() => { const element = document.getElementById(modalId); if (!element) return undefined; element.addEventListener('hidden.bs.modal', cleanupModal); return () => element.removeEventListener('hidden.bs.modal', cleanupModal); }, [modalId]);
  const formValue = (value) => value?._id || value || '';
  const editRecord = (item) => { setEditing(item); setForm({ ...item, yearId: formValue(item.yearId), semesterId: formValue(item.semesterId), facultyId: formValue(item.facultyId) }); };
  const save = async (event) => {
    event.preventDefault(); clearFeedback(); setSaving(true);
    try {
      if (type === 'semesters' && !form.yearId) throw new Error('Select a year');
      if ((type === 'subjects' || type === 'students') && (!form.yearId || !form.semesterId)) throw new Error('Select year and semester');
      if (editing) await api.put(`/${type}/${editing._id}`, form); else await api.post(`/${type}`, form);
      closeModal(); setForm({}); setEditing(null); setPage(1); setMessage(`${config.singular} ${editing ? 'updated' : 'added'} successfully`); await load();
    } catch (saveError) { setError(saveError.response?.data?.message || saveError.message || 'Could not save record'); }
    finally { setSaving(false); }
  };
  const remove = async (id) => { if (!confirm(`Delete this ${config.singular}?`)) return; clearFeedback(); try { await api.delete(`/${type}/${id}`); setMessage('Record deleted'); if (items.length === 1 && page > 1) setPage(page - 1); else await load(); } catch (removeError) { setError(removeError.response?.data?.message || 'Delete failed'); } };
  const display = (item, key) => item[key]?.name || item[key] || '—';
  const row = (item) => <tr key={item._id}>{type === 'years' && <><td><strong>{item.name}</strong></td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}{type === 'semesters' && <><td><strong>{item.name}</strong></td><td>{display(item, 'yearId')}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}{type === 'subjects' && <><td><strong>{item.code}</strong></td><td>{item.name}</td><td>{item.batchName || '—'}</td><td>{display(item, 'facultyId') || item.facultyName || '—'}</td><td>{display(item, 'yearId')}</td><td>{display(item, 'semesterId')}</td><td>{item.type}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}{type === 'students' && <><td><strong>{item.crNo}</strong></td><td>{item.name}</td><td>{display(item, 'yearId')}</td><td>{display(item, 'semesterId')}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td></>}<td><button className="table-action" onClick={() => editRecord(item)} data-bs-toggle="modal" data-bs-target={`#${modalId}`} aria-label={`Edit ${config.singular}`}><i className="bi bi-pencil" /></button><button className="table-action danger" onClick={() => remove(item._id)} aria-label={`Delete ${config.singular}`}><i className="bi bi-trash3" /></button></td></tr>;
  const openNew = () => { cleanupModal(); clearFeedback(); setEditing(null); setForm(type === 'subjects' ? { type: 'Theory', courseName: 'BCA', batchName: 'General' } : {}); };
  const changePageSize = (size) => { setPageSize(size); setPage(1); };
  return <><div className="page-title"><div><span className="eyebrow">CONFIGURATION</span><h2>{config.title}</h2><p className="muted">Manage the academic records used throughout attendance.</p></div><button className="primary-button" onClick={openNew} data-bs-toggle="modal" data-bs-target={`#${modalId}`}><i className="bi bi-plus-lg" /> Add {config.singular}</button></div><Toast message={message || error} error={Boolean(error)} onClose={clearFeedback} /><div className="toolbar"><div className="search-box"><i className="bi bi-search" /><input placeholder={`Search ${config.singular}s...`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div><span className="record-count">{total} records</span></div>{loading ? <Loading /> : items.length ? <section className="panel"><Table headers={config.headers.concat('Actions')}>{items.map(row)}</Table><Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={total} onChange={setPage} onPageSizeChange={changePageSize} /></section> : <section className="panel"><Empty text={`No ${config.singular}s yet.`} /></section>}<div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby={`${modalId}-title`}><div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h3 id={`${modalId}-title`}>{editing ? 'Edit' : 'Add'} {config.singular}</h3><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" /></div><form onSubmit={save}><div className="modal-body">{config.fields.map(([key, label]) => <label key={key}>{label}<input value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required /></label>)}{(type === 'semesters' || type === 'subjects' || type === 'students') && <label>Year<select value={form.yearId || ''} onChange={(event) => setForm({ ...form, yearId: event.target.value, semesterId: '' })} required><option value="">Select year</option>{years.map((year) => <option value={year._id} key={year._id}>{year.name}</option>)}</select></label>}{(type === 'subjects' || type === 'students') && <label>Semester<select value={form.semesterId || ''} onChange={(event) => setForm({ ...form, semesterId: event.target.value })} required><option value="">Select semester</option>{semesters.filter((semester) => !form.yearId || semester.yearId?._id === form.yearId || semester.yearId === form.yearId).map((semester) => <option value={semester._id} key={semester._id}>{semester.name}</option>)}</select></label>}{type === 'subjects' && <label>Faculty<select value={form.facultyId || ''} onChange={(event) => setForm({ ...form, facultyId: event.target.value })}><option value="">Unassigned</option>{faculty.map((item) => <option value={item.id || item._id} key={item.id || item._id}>{item.name} ({item.email})</option>)}</select></label>}{type === 'subjects' && <label>Type<select value={form.type || 'Theory'} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Theory</option><option>Practical</option></select></label>}</div><div className="modal-footer"><button type="button" className="secondary-button" data-bs-dismiss="modal">Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div></form></div></div></div></>;
}
