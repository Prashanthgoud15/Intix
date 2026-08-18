import React from 'react';
import Button from './Button';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
            {Icon && (
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                    <Icon className="w-6 h-6 text-slate-400" />
                </div>
            )}
            <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-400 max-w-sm mb-6">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
