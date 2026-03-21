import React from 'react';

interface $ { name }Props {
    title ?: string;
    children ?: React.ReactNode;
}

const styles = {
    container: {
        fontFamily: "'$body_font', system-ui, sans-serif",
        backgroundColor: '$background_color',
        color: '$text_color',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 200ms ease',
    },
    heading: {
        fontFamily: "'$heading_font', system-ui, sans-serif",
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '8px',
        color: '$primary_color',
    },
    button: {
        backgroundColor: '$primary_color',
        color: 'white',
        border: 'none',
        padding: '8px 24px',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 200ms ease',
    },
} as const;

export const $name: React.FC<${ name }Props> = ({ title = '$name', children }) => {
    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>{title}</h2>
            {children}
            <button style={styles.button}>Action</button>
        </div>
    );
};

export default $name;
