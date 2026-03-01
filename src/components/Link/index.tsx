import React, { FC, useEffect } from "react";

import "./style.scss";

interface LinkTarget {
    target: string;
    type: any;
}

export interface LinkProps {
    text: string;
    target: string | LinkTarget[];
    className?: string;

    onClick?: (target: string | LinkTarget[], shiftKey: boolean) => void;
    onRendered?: () => void;
}

// Global admin unlock state — toggled via Alt+A
let adminUnlocked = false;
export const setAdminUnlocked = (val: boolean) => { adminUnlocked = val; };
export const getAdminUnlocked = () => adminUnlocked;

const Link: FC<LinkProps> = (props) => {
    const { text, target, className, onClick, onRendered } = props;
    const css = ["__link__", className ? className : null].join(" ").trim();

    let touches = 0;
    const handleTouchStart = (e: React.TouchEvent<HTMLSpanElement>) => {
        touches = e.touches.length;
    };
    const handleTouchEnd = (e: React.TouchEvent<HTMLSpanElement>) => {
        e.preventDefault();
        // 2-finger tap OR admin unlocked both trigger shift behaviour
        onClick && onClick(target, touches > 1 || adminUnlocked);
        touches = 0;
    };

    const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        // shift key OR admin unlocked both trigger admin behaviour
        onClick && onClick(target, e.shiftKey || adminUnlocked);
    };

    const handleRendered = () => (onRendered && onRendered());
    useEffect(() => handleRendered());

    return (
        <span
            className={css}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {text}
        </span>
    );
};

export default Link;
