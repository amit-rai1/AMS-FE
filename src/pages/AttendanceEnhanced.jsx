import { useEffect, useState } from 'react';
import api from '../services/api';
import { Loading, Empty, Toast } from '../components/UI';

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceEnhanced() {
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ date: today() });
  const [records, setRecords] = useState({});
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/years'), api.get('/semesters'), api.get('/subjects')]).then(([yearsResponse, semestersResponse, subjectsResponse]) => {
      setYears(yearsResponse.data); setSemesters(semestersResponse.data); setSubjects(subjectsResponse.data);
    }).catch(() => setError('Could not load class options.'));
  }, []);

  useEffect(() => {
    if (!form.yearId || !form.semesterId) { setStudents([]); setRecords({}); setExisting(false); return; }
    setLoading(true); setMessage('');
    const rosterRequest = api.get(`/attendance/roster?yearId=${form.yearId}&semesterId=${form.semesterId}&batchName=${encodeURIComponent(form.batchName || 'General')}`);
    const attendanceRequest = form.subjectId && form.date ? api.get(`/attendance?subjectId=${form.subjectId}&batchName=${encodeURIComponent(form.batchName || 'General')}&date=${form.date}`) : Promise.resolve({ data: [] });
    Promise.all([rosterRequest, attendanceRequest]).then(([rosterResponse, attendanceResponse]) => {
      const roster = rosterResponse.data; const marked = attendanceResponse.data;
      const markedByStudent = Object.fromEntries(marked.map((item) => [item.studentId?._id || item.studentId, item]));
      setStudents(roster); setExisting(marked.length > 0);
      setRecords(Object.fromEntries(roster.map((student) => [student._id, {
        status: markedByStudent[student._id]?.status || '', remarks: markedByStudent[student._id]?.remarks || '', attendanceId: markedByStudent[student._id]?._id
      }])));
    }).catch(() => setError('Could not load the class register.')).finally(() => setLoading(false));
  }, [form.yearId, form.semesterId, form.subjectId, form.batchName, form.date]);

  const updateForm = (changes) => { setForm((current) => ({ ...current, ...changes })); setError(''); };
  const updateRecord = (studentId, changes) => setRecords((current) => ({ ...current, [studentId]: { ...current[studentId], ...changes } }));
  const setAll = (status) => setRecords(Object.fromEntries(students.map((student) => [student._id, { ...records[student._id], status }])));
  const save = async () => {
    setError('');
    const markedStudents = students.filter((student) => records[student._id]?.status);
    if (!form.yearId || !form.semesterId || !form.subjectId || !form.date || !students.length) return setError('Select year, semester, subject, date, and a class with students.');
    if (!markedStudents.length) return setError('Mark Present or Absent for at least one student before saving.');
    try {
      await api.post('/attendance/bulk', { ...form, batchName: form.batchName || 'General', records: markedStudents.map((student) => ({ studentId: student._id, status: records[student._id].status, remarks: records[student._id]?.remarks || '' })) });
      setExisting(true); setMessage(existing ? 'Attendance updated successfully.' : 'Attendance marked successfully.');
    } catch (saveError) { setError(saveError.response?.data?.message || 'Could not save attendance.'); }
  };
  const selectedSubject = subjects.find((subject) => subject._id === form.subjectId);

  return <><div className="page-title"><div><span className="eyebrow">DAILY REGISTER</span><h2>Mark attendance</h2><p className="muted">Choose a class, then record presence for every student.</p></div><button className="primary-button" onClick={save}><i className="bi bi-check2" /> {existing ? 'Update attendance' : 'Save attendance'}</button></div><Toast message={message} error={!!error} /><section className="panel attendance-panel"><div className="attendance-filters"><label>Year<select value={form.yearId || ''} onChange={(event) => updateForm({ yearId: event.target.value, semesterId: '', subjectId: '' })}><option value="">Select year</option>{years.map((year) => <option value={year._id} key={year._id}>{year.name}</option>)}</select></label><label>Semester<select value={form.semesterId || ''} onChange={(event) => updateForm({ semesterId: event.target.value, subjectId: '' })}><option value="">Select semester</option>{semesters.filter((semester) => !form.yearId || (semester.yearId?._id || semester.yearId) === form.yearId).map((semester) => <option value={semester._id} key={semester._id}>{semester.name}</option>)}</select></label><label>Subject<select value={form.subjectId || ''} onChange={(event) => updateForm({ subjectId: event.target.value })}><option value="">Select subject</option>{subjects.filter((subject) => !form.semesterId || (subject.semesterId?._id || subject.semesterId) === form.semesterId).map((subject) => <option value={subject._id} key={subject._id}>{subject.code} · {subject.name}</option>)}</select></label><label>Date<input type="date" value={form.date} onChange={(event) => updateForm({ date: event.target.value })} /></label></div>{existing && <div className="marked-banner"><i className="bi bi-check-circle-fill" /><div><strong>Attendance already marked</strong><span>{selectedSubject?.code || 'Selected subject'} on {form.date}. You can edit the status or remarks and update it.</span></div><button className="secondary-button" onClick={() => document.querySelector('.attendance-panel')?.scrollIntoView({ behavior: 'smooth' })}><i className="bi bi-pencil" /> Edit</button></div>}<div className="register-head"><div><span className="eyebrow">CLASS REGISTER</span><h3>{students.length ? `${students.length} students enrolled` : 'Select a class to begin'}</h3></div>{students.length > 0 && <div className="quick-actions"><button className="secondary-button" onClick={() => setAll('Present')}>All present</button><button className="secondary-button" onClick={() => setAll('Absent')}>All absent</button></div>}</div>{loading ? <Loading /> : students.length ? <div className="table-wrap"><table><thead><tr><th>#</th><th>CR No.</th><th>Student</th><th>Attendance status</th><th>Remarks</th><th>State</th></tr></thead><tbody>{students.map((student, index) => <tr key={student._id}><td>{String(index + 1).padStart(2, '0')}</td><td><strong>{student.crNo}</strong></td><td>{student.name}</td><td><div className="status-toggle"><button className={records[student._id]?.status === 'Present' ? 'selected present' : ''} onClick={() => updateRecord(student._id, { status: 'Present' })}>Present</button><button className={records[student._id]?.status === 'Absent' ? 'selected absent' : ''} onClick={() => updateRecord(student._id, { status: 'Absent' })}>Absent</button></div></td><td><input className="inline-input" placeholder="Optional note" value={records[student._id]?.remarks || ''} onChange={(event) => updateRecord(student._id, { remarks: event.target.value })} /></td><td>{records[student._id]?.attendanceId ? <span className="status marked">Marked <i className="bi bi-pencil" /></span> : <span className="status pending">New</span>}</td></tr>)}</tbody></table></div> : <Empty text="Your filtered class roster will appear here." />}</section></>;
}
