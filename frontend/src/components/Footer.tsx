import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link to="/contact">contact</Link>
        <span className="footer-sep">|</span>
        <Link to="/about">about</Link>
        <span className="footer-sep">|</span>
        <a href="https://github.com/adtommo/anaroo" target="_blank" rel="noopener noreferrer">
          github
        </a>
        <span className="footer-sep">|</span>
        <Link to="/terms">terms</Link>
        <span className="footer-sep">|</span>
        <Link to="/security">security</Link>
        <span className="footer-sep">|</span>
        <Link to="/privacy">privacy</Link>
        <span className="footer-sep">|</span>
        <Link to="/accessibility">accessibility</Link>
      </div>
    </footer>
  );
}
