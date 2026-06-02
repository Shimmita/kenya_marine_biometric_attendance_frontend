const GmailIcon = ({ size = 24 }) => (
  <svg 
    xmlns="http://w3.org" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size}
  >
    <path fill="#4285F4" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" opacity=".3"/>
    <path fill="#EA4335" d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v1l10 6 10-6V6z"/>
    <path fill="#34A853" d="M2 7v11c0 1.1.9 2 2 2h4v-8l-6-5z"/>
    <path fill="#4285F4" d="M22 7l-6 5v8h4c1.1 0 2-.9 2-2V7z"/>
    <path fill="#FBBC05" d="M8 12v8h8v-8l-4 3-4-3z"/>
  </svg>
);

export default GmailIcon;