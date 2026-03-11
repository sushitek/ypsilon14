import React, { Component, ReactElement } from "react";

// css
import "./style.scss";

interface TeletypeProps {
    text: string;
    className?: string;
    autostart?: boolean;
    autocomplete?: boolean;
    speed?: number;

    onComplete: () => void;
    onNewLine?: () => void;
}

interface TeletypeState {
    index: number;
    char: number;
    active: boolean;
    done: boolean;
    paused: boolean;
}

class Teletype extends Component<TeletypeProps, TeletypeState> {
    private _cursorInterval = 5;
    private _animateTimerId: number = null;
    private _cursorRef: React.RefObject<HTMLElement> = null;
    private _cursorY: number = null;

    constructor(props: TeletypeProps) {
        super(props);

        this._cursorRef = React.createRef<HTMLElement>();
        this._cursorY = 0;

        const done = !!props.autocomplete;
        const paused = props.autostart === false;

        this._cursorInterval = props.speed || this._cursorInterval;

        this.state = {
            index: 0,
            char: 0,
            active: false,
            done,
            paused,
        };

        this._animate = this._animate.bind(this);
        this._updateState = this._updateState.bind(this);
    }

    public render(): ReactElement {
        const { text, className } = this.props;
        const { char, done, active } = this.state;

        const visible = text.substr(0, char);
        const cursor = text.substr(char, 1) || " ";
        const hidden = text.substr(char + 1);

        if (!active || done) return null;

        const css = ["__teletype__", className ? className : null].join(" ").trim();

        return (
            <div className={css}>
                <span className="visible">{visible}</span>
                <span className="cursor" ref={this._cursorRef}>{cursor}</span>
                <span className="hidden">{hidden}</span>
            </div>
        );
    }

    public componentDidMount(): void {
        const { paused, done } = this.state;
        if (done) { this._onComplete(); return; }
        if (!paused) {
            this.setState({ active: true }, () => this._animate());
        }
    }

    public componentDidUpdate(prevProps: TeletypeProps, prevState: TeletypeState): void {
        if (!prevState.done && this.state.done) this._onComplete();
        if (this.state.done) return;
        this._animate();
    }

    public componentWillUnmount(): void {
        if (this._animateTimerId !== null) {
            clearTimeout(this._animateTimerId);
            this._animateTimerId = null;
        }
    }

    private _animate(): void {
        this._clearAnimateTimer();
        if (this.state.paused) return;
        this._getCursorPosition();
        this._animateTimerId = window.setTimeout(this._updateState, this._cursorInterval);
    }

    private _getCursorPosition(): void {
        const { onNewLine } = this.props;
        const ref = this._cursorRef;
        const y = this._cursorY;
        if (ref && ref.current) {
            const top = ref.current.offsetTop;
            if (y !== top) {
                this._cursorY = top;
                onNewLine && onNewLine();
            }
        }
    }

    private _clearAnimateTimer(): void {
        if (this._animateTimerId !== null) {
            window.clearTimeout(this._animateTimerId);
            this._animateTimerId = null;
        }
    }

    private _updateState(): void {
        const { text } = this.props;
        const { char, active, done, paused } = this.state;
        if (done) return;

        let nextChar = char;
        let nextActive = active;
        let nextDone = done;

        if (!nextActive) nextActive = true;

        if (char < text.length) {
            nextChar = char + 1;
        } else {
            nextActive = false;
            nextDone = true;
        }

        this.setState({ char: nextChar, active: nextActive, done: nextDone, paused });
    }

    private _onComplete(): void {
        const { onComplete } = this.props;
        onComplete && onComplete();
    }
}

export default Teletype;
