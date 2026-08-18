import React from 'react';

const Badge = React.forwardRef(({
    children,
    variant = 'default',
    className = '',
    ...props
}, ref) => {
    const variants = {
        default: 'bg-slate-800 text-slate-300 border border-slate-700',
        primary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };

    return (
        <span
            ref={ref}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';

export default Badge;
