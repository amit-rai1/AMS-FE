import axios from 'axios';

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || `http://${apiHost}:5000/api` });
api.interceptors.request.use((config) => { const token = localStorage.getItem('attendly_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, (error) => {
	if (error.response?.status === 401) {
		localStorage.removeItem('attendly_token');
		localStorage.removeItem('attendly_user');
		window.dispatchEvent(new Event('attendly:logout'));
	}
	return Promise.reject(error);
});
export default api;
