import React, { useState } from 'react';

export default function Input({ type = 'text', value, onChange, label, style }) {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e) => {
        if (!e.target.value) setIsFocused(false);
    };

    return (
        <div className={`input-wrapper ${isFocused || value ? 'focused' : ''}`} style={style}>
            <input
                type={type}
                className="input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
            />
            <label className="input-label">{label}</label>
        </div>
    );
}
