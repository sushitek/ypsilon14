import React, { FC, useEffect } from "react";

import "./style.scss";

import { playBeep } from "../../utils/sounds";

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

// Global admin unlock state
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
        playBeep();
        onClick && onClick(target, touches > 1 || adminUnlocked);
        touches = 0;
    };

    const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        playBeep();
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
