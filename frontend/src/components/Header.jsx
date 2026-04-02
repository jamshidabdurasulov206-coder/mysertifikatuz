import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { dark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: dark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
      transition: 'all 0.3s ease'
    }}>
      <div className="bba-container" style={{
        height: '80px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo Section */}
        <div 
          onClick={() => navigate('/tests')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #2563eb, #6366f1)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)'
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '20px' }}>B</span>
          </div>
          <div>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: 900, 
              margin: 0, 
              letterSpacing: '-0.5px',
              color: dark ? '#f1f5f9' : '#0f172a'
            }}>BBA</h1>
            <p style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              margin: 0, 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              color: '#3b82f6'
            }}>Platforma</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[
            { name: 'Testlar', path: '/tests' },
            { name: 'Natijalarim', path: '/profile' },
          ].map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: isActive(link.path) ? 900 : 600,
                color: isActive(link.path) ? '#2563eb' : (dark ? '#94a3b8' : '#64748b'),
                cursor: 'pointer',
                padding: '8px 0',
                position: 'relative',
                transition: 'color 0.2s ease'
              }}
            >
              {link.name}
              {isActive(link.path) && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '3px',
                  background: '#2563eb',
                  borderRadius: '10px',
                  animation: 'fadeIn 0.3s ease'
                }} />
              )}
            </button>
          ))}
          
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Admin Panel
            </button>
          )}
        </nav>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
              background: dark ? '#1e293b' : '#ffffff',
              color: dark ? '#f1f5f9' : '#0f172a',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 8px 20px -10px rgba(15,23,42,0.4)'
            }}
          >
            <span style={{ fontWeight: 900 }}>&lt;</span>
            Ortga
          </button>

          <DarkModeToggle />
          
          <div style={{ height: '24px', width: '1px', background: dark ? '#334155' : '#e2e8f0' }} />
          
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
              color: dark ? '#f1f5f9' : '#0f172a',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#f43f5e';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#f43f5e';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = dark ? '#f1f5f9' : '#0f172a';
              e.currentTarget.style.borderColor = dark ? '#334155' : '#e2e8f0';
            }}
          >
            Chiqish
          </button>
        </div>
      </div>
    </header>
  );
}
