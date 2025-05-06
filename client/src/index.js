import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { disableReactDevTools} from '@fvilers/disable-react-devtools';
import ReactGA from "react-ga4";

if (process.env.NODE_ENV === 'production') disableReactDevTools() //disables react dev tools when we deploy 
ReactGA.initialize("G-B802PGEZWF"); // Google analytics
ReactGA.send("pageview"); // logs the homepage visit

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
