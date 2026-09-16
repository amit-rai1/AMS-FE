export function StatCard({ icon, label, value, detail, tone = 'teal' }) { return <div className={`stat-card tone-${tone}`}><div className="stat-icon"><i className={`bi bi-${icon}`} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
import logo from '../public/logo.png';

export function Loading() { return <div className="loading"><img src={logo} alt="BCA Department logo" /><span className="spinner-border spinner-border-sm" /> Loading records...</div>; }
export function Empty({ text = 'No records found.' }) { return <div className="empty"><i className="bi bi-inbox" /><p>{text}</p></div>; }
import { useEffect, useState } from 'react';

export function Toast({ message, error, onClose }) {
	const [visible, setVisible] = useState(Boolean(message));
	useEffect(() => {
		setVisible(Boolean(message));
		if (!message) return undefined;
		const timer = window.setTimeout(() => setVisible(false), 3000);
		return () => window.clearTimeout(timer);
	}, [message]);
	return visible && message && <div className={`toast-message ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}><i className={`bi bi-${error ? 'exclamation-circle' : 'check-circle'}`} /> <span>{message}</span><button type="button" className="toast-close" onClick={() => { setVisible(false); onClose?.(); }} aria-label="Dismiss notification"><i className="bi bi-x-lg" /></button></div>;
}
export function Table({ headers, children }) { return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
export function Pagination({ page, totalPages, pageSize, total, onChange, onPageSizeChange }) {
	if (totalPages <= 1 && !onPageSizeChange) return null;
	return <div className="pagination"><button type="button" className="table-action" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><i className="bi bi-chevron-left" /></button><span>Page {page} of {totalPages}</span><button type="button" className="table-action" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><i className="bi bi-chevron-right" /></button>{onPageSizeChange && <label className="page-size">Rows <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>{[25, 50, 100].map((size) => <option value={size} key={size}>{size}</option>)}</select>{typeof total === 'number' ? ` of ${total}` : ''}</label>}</div>;
}
