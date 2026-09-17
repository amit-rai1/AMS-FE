import { useState } from 'react';
import api from '../services/api';
import { Toast } from '../components/UI';

const initialForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function Settings() {
  const [form, setForm] = useState(initialForm);
  const [visible, setVisible] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setMessage(''); setError(''); };
  const submit = async (event) => {
    event.preventDefault(); setMessage(''); setError('');
    try { const { data } = await api.post('/auth/change-password', form); setMessage(data.message); setForm(initialForm); }
    catch (saveError) { setError(saveError.response?.data?.message || 'Could not change password'); }
  };
  const passwordField = (field, label) => <label>{label}<div className="password-input"><input type={visible[field] ? 'text' : 'password'} value={form[field]} onChange={(event) => update(field, event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setVisible((current) => ({ ...current, [field]: !current[field] }))} aria-label={visible[field] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}><i className={`bi bi-eye${visible[field] ? '-slash' : ''}`} /></button></div></label>;
  return <><div className="page-title"><div><span className="eyebrow">ACCOUNT</span><h2>Security settings</h2><p className="muted">Update your account password.</p></div></div><Toast message={message || error} error={Boolean(error)} onClose={() => { setMessage(''); setError(''); }} /><section className="panel settings-panel"><form onSubmit={submit}><h3>Change password</h3>{passwordField('currentPassword', 'Current password')}{passwordField('newPassword', 'New password')}{passwordField('confirmPassword', 'Confirm new password')}<button className="primary-button" type="submit"><i className="bi bi-shield-lock" /> Update password</button></form></section></>;
}
