import React from 'react'; import ReactDOM from 'react-dom/client'; import 'bootstrap/dist/css/bootstrap.min.css'; import 'bootstrap/dist/js/bootstrap.bundle.min.js'; import 'bootstrap-icons/font/bootstrap-icons.css'; import './styles.css'; import './responsive.css'; import './student-import.css'; import logo from './public/logo.png'; import App from './App';
document.title = 'M.L.K (P.G) College Balrampur | BCA Department';
const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link'); favicon.rel = 'icon'; favicon.href = logo; document.head.appendChild(favicon);
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
