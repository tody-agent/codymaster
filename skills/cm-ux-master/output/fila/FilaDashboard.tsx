import React from 'react';

interface $ { name }Props {
    title ?: string;
    children ?: React.ReactNode;
}

const styles = {
    container: {
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 200ms ease',
    },
    heading: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '8px',
        color: '#2563eb',
    },
    button: {
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        padding: '8px 24px',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 200ms ease',
    },
} as const;

export const FilaDashboard: React.FC<${ name }Props> = ({ title = 'FilaDashboard', children }) => {
    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>{title}</h2>
            {children}
            <button style={styles.button}>Action</button>
        </div>
    );
};

export default FilaDashboard;
