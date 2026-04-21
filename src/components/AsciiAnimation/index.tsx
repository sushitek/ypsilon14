import React, { Component, ReactElement } from "react";
import "./style.scss";

interface AsciiAnimationProps {
    frames: string[];
    fps?: number;
    loop?: boolean;
    className?: string;
    autostart?: boolean;
    onComplete?: () => void;
}

interface AsciiAnimationState {
    currentFrame: number;
    active: boolean;
    done: boolean;
}

class AsciiAnimation extends Component<AsciiAnimationProps, AsciiAnimationState> {
    private _animateTimerId: number = null;
    private _fpsInterval: number = 150;

    constructor(props: AsciiAnimationProps) {
        super(props);
        this._fpsInterval = Math.max(50, Math.round(1000 / (props.fps || 6)));
        this.state = {
            currentFrame: 0,
            active: false,
            done: false,
        };
        this._animate = this._animate.bind(this);
    }

    public render(): ReactElement {
        const { className, frames } = this.props;
        const { currentFrame, active, done } = this.state;

        if (!active || done || frames.length === 0) return null;

        const css = ["__ascii-animation__", className || null].join(" ").trim();

        return (
            <pre className={css}>
                {frames[currentFrame]}
            </pre>
        );
    }

    public componentDidMount(): void {
        const { autostart } = this.props;
        if (autostart !== false) {
            this.setState({ active: true }, () => this._scheduleNext());
        }
    }

    public componentWillUnmount(): void {
        this._clearAnimationTimer();
    }

    private _scheduleNext(): void {
        this._clearAnimationTimer();
        this._animateTimerId = window.setTimeout(this._animate, this._fpsInterval);
    }

    private _animate(): void {
        const { loop, frames } = this.props;
        const { currentFrame } = this.state;
        const isLast = currentFrame >= frames.length - 1;

        if (isLast) {
            if (loop) {
                this.setState({ currentFrame: 0 }, () => this._scheduleNext());
            } else {
                this.setState({ active: false, done: true }, () => {
                    this.props.onComplete && this.props.onComplete();
                });
            }
        } else {
            this.setState({ currentFrame: currentFrame + 1 }, () => this._scheduleNext());
        }
    }

    private _clearAnimationTimer(): void {
        if (this._animateTimerId !== null) {
            window.clearTimeout(this._animateTimerId);
            this._animateTimerId = null;
        }
    }
}

export const CASSETTE_FRAMES = [
    "  _________\n |  _   _  |\n | (_) (_) |\n |_________|\n",
    "  _________\n | (_.  ._|)\n |  _) (_  |\n |_________|\n",
    "  _________\n |  _.) ._ )\n | (_   _) |\n |_________|\n",
    "  _________\n | (.  _(_ |\n |  _) _)  |\n |_________|\n",
    "  _________\n |  _) _. _)\n | (_ ( _  |\n |_________|\n",
    "  _________\n | _(_) _) |\n | (_   _) |\n |_________|\n",
];

export default AsciiAnimation;
