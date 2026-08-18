import React from 'react';

const Card = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={`bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div ref={ref} className={`px-6 py-4 border-b border-slate-800/50 ${className}`} {...props}>
            {children}
        </div>
    );
});
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <h3 ref={ref} className={`text-lg font-semibold text-white ${className}`} {...props}>
            {children}
        </h3>
    );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <p ref={ref} className={`text-sm text-slate-400 mt-1 ${className}`} {...props}>
            {children}
        </p>
    );
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div ref={ref} className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
});
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div ref={ref} className={`px-6 py-4 bg-slate-900/30 border-t border-slate-800/50 flex items-center ${className}`} {...props}>
            {children}
        </div>
    );
});
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
