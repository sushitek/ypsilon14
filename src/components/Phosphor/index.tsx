import React, { Component, ReactElement } from "react";

// css
import "./style.scss";

// modules
import { nanoid } from "nanoid";

// components
import Teletype from "../Teletype";
import Link from "../Link";
import Text from "../Text";
import Bitmap from "../Bitmap";
import Prompt, { PROMPT_DEFAULT } from "../Prompt";
import Toggle from "../Toggle";
import Modal from "../Modal";
import Scanlines from "../Scanlines";
import { setAdminUnlocked, getAdminUnlocked } from "../Link";

import json from "../../data/ypsilon14.json";

// Secret password to unlock admin mode — typed anywhere on the page (Mac keyboard)
const ADMIN_PASSWORD = "sonya";
// Admin server poll interval in ms
const POLL_INTERVAL = 2000;

interface AppState {
    screens: Screen[];
    dialogs: any[];
    activeScreenId: string;
    activeElementId: string;
    activeDialogId: string;
    loadingQueue: any[];
    status: AppStatus;
    renderScanlines: boolean;
    adminUnlocked: boolean;
}

enum DialogType {
    Unknown = 0,
    Alert,
    Confirm,
    Dialog,
}

interface Dialog {
    id: string;
    type: DialogType;
    [key: string]: any;
}

enum ScreenType {
    Unknown = 0,
    Screen,
    Static,
}

enum ScreenDataType {
    Unknown = 0,
    Text,
    Link,
    Bitmap,
    Prompt,
    Toggle,
}

enum ScreenDataState {
    Unloaded = 0,
    Ready,
    Active,
    Done,
}

interface ScreenData {
    id: string;
    type: ScreenDataType;
    state: ScreenDataState;
    [key: string]: any;
}

interface Screen {
    id: string;
    type: ScreenType;
    content: ScreenData[];
}

enum AppStatus {
    Unset = 0,
    Ready,
    Active,
    Done,
}

class Phosphor extends Component<any, AppState> {
    private _containerRef: React.RefObject<HTMLElement>;
    private _lineheight: number = null;
    private _colwidth: number = null;
    private _passwordBuffer: string = "";
    private _passwordTimeout: any = null;
    private _pollInterval: any = null;

    constructor(props: any) {
        super(props);
        this._containerRef = React.createRef<HTMLElement>();
        this.state = {
            screens: [],
            dialogs: [],
            activeScreenId: null,
            activeElementId: null,
            activeDialogId: null,
            loadingQueue: [],
            status: AppStatus.Unset,
            renderScanlines: true,
            adminUnlocked: false,
        };
        this._changeScreen = this._changeScreen.bind(this);
        this._setElementState = this._setElementState.bind(this);
        this._handlePromptCommand = this._handlePromptCommand.bind(this);
        this._handleTeletypeNewLine = this._handleTeletypeNewLine.bind(this);
        this._handleLinkClick = this._handleLinkClick.bind(this);
        this._handlePasswordKey = this._handlePasswordKey.bind(this);
        this._handleFullscreen = this._handleFullscreen.bind(this);
        this._pollAdminStatus = this._pollAdminStatus.bind(this);
    }

    public componentDidMount(): void {
        this._parseScreens();
        this._parseDialogs();
        document.addEventListener("keydown", this._handlePasswordKey);

        // Start polling the admin server every 2 seconds
        this._pollAdminStatus();
        this._pollInterval = setInterval(this._pollAdminStatus, POLL_INTERVAL);
    }

    public componentWillUnmount(): void {
        document.removeEventListener("keydown", this._handlePasswordKey);
        if (this._passwordTimeout) clearTimeout(this._passwordTimeout);
        if (this._pollInterval) clearInterval(this._pollInterval);
    }

    // Poll the admin server for current admin state
    private _pollAdminStatus(): void {
        fetch('http://localhost:3001/admin/status')
            .then(res => res.json())
            .then(data => {
                const serverAdmin = !!data.admin;
                if (serverAdmin !== getAdminUnlocked()) {
                    setAdminUnlocked(serverAdmin);
                    this.setState({ adminUnlocked: serverAdmin });
                }
            })
            .catch(() => {
                // Server not running — silently ignore, fall back to keyboard password
            });
    }

    // Listen for password typed anywhere — buffers keypresses, resets after 2s inactivity
    private _handlePasswordKey(e: KeyboardEvent): void {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key.length !== 1) return;

        this._passwordBuffer += e.key.toLowerCase();

        if (this._passwordBuffer.length > ADMIN_PASSWORD.length) {
            this._passwordBuffer = this._passwordBuffer.slice(-ADMIN_PASSWORD.length);
        }

        if (this._passwordBuffer === ADMIN_PASSWORD) {
            this._passwordBuffer = "";
            const next = !getAdminUnlocked();
            setAdminUnlocked(next);
            this.setState({ adminUnlocked: next });
        }

        if (this._passwordTimeout) clearTimeout(this._passwordTimeout);
        this._passwordTimeout = setTimeout(() => {
            this._passwordBuffer = "";
        }, 2000);
    }

    private _handleFullscreen(): void {
        const el = document.documentElement;
        if (!document.fullscreenElement) {
            el.requestFullscreen && el.requestFullscreen();
        } else {
            document.exitFullscreen && document.exitFullscreen();
        }
    }

    public render(): ReactElement {
        const { activeScreenId, activeDialogId, renderScanlines } = this.state;

        return (
            <div className="phosphor">
                {/* Subtle fullscreen button only — no visible admin indicator */}
                <div style={{
                    position: "fixed", top: "8px", right: "8px",
                    zIndex: 1000, fontFamily: "monospace", fontSize: "0.65em",
                    opacity: 0.3,
                }}>
                    <span
                        onClick={this._handleFullscreen}
                        style={{ cursor: "pointer", color: "#33ff33" }}
                        title="Toggle fullscreen"
                    >[F]</span>
                </div>

                <section className={"__main__"} ref={this._containerRef}>
                    {activeScreenId && this._renderScreen()}
                </section>

                {activeDialogId && this._renderDialog()}
                {renderScanlines && <Scanlines />}
            </div>
        );
    }

    private _parseScreens(): void {
        const screens = json.screens.map((element) => this._buildScreen(element));
        if (!screens.length) return;
        const activeScreen = 0;
        this.setState({ screens }, () => this._setActiveScreen(activeScreen));
    }

    private _parseDialogs(): void {
        const dialogs = json.dialogs.map((element) => this._buildDialog(element));
        if (!dialogs.length) return;
        this.setState({ dialogs });
    }

    private _buildDialog(src: any): Dialog {
        const id = src.id || null;
        const type = this._getDialogType(src.type);
        let content: any[] = null;
        if (type === DialogType.Alert) content = src.content;
        return { id, type, content };
    }

    private _getDialogType(type: string): DialogType {
        switch (type.toLowerCase()) {
            case "alert": return DialogType.Alert;
            case "confirm": return DialogType.Confirm;
            case "dialog": return DialogType.Dialog;
            default: return DialogType.Unknown;
        }
    }

    private _setActiveScreen(index: number): void {
        const { screens } = this.state;
        const activeScreen = screens[index].id;
        this.setState({ activeScreenId: activeScreen }, () => this._activateScreen());
    }

    private _activateScreen(): void {
        const screen = this._getScreen(this.state.activeScreenId);
        const status = AppStatus.Active;
        switch (screen.type) {
            case ScreenType.Static:
                this.setState({ status });
                break;
            case ScreenType.Screen:
                screen.content[0].state = ScreenDataState.Active;
                this.setState({ status, activeElementId: screen.content[0].id });
                break;
            default:
                break;
        }
    }

    private _buildScreen(src: any): Screen {
        const id = src.id || null;
        const type = this._getScreenType(src.type);
        const content = this._parseScreenContent(src.content).flat();
        if (!id || !type) return;
        return { id, type, content };
    }

    private _getScreenType(type: string): ScreenType {
        switch (type.toLowerCase()) {
            case "screen": return ScreenType.Screen;
            case "static": return ScreenType.Static;
            default: return ScreenType.Unknown;
        }
    }

    private _renderScreen(): ReactElement[] {
        const screen = this._getScreen(this.state.activeScreenId);
        if (!screen) return;
        return screen.content.map((element, index) => {
            if (element.state === ScreenDataState.Ready) return null;
            if (element.state === ScreenDataState.Active) {
                return <div className="active" key={index}>{this._renderActiveElement(element, index)}</div>;
            }
            if (element.state === ScreenDataState.Done) {
                return <div className="rendered" key={index}>{this._renderStaticElement(element, index)}</div>;
            }
            return null;
        });
    }

    private _getScreen(id: string): Screen {
        return this.state.screens.find(element => element.id === id);
    }

    private _parseScreenContent(content: any[]): ScreenData[] {
        if (!content) return [];
        const parsed = content.map(element => this._parseScreenContentElement(element)).flat();
        return parsed.map(element => this._generateScreenData(element));
    }

    private _generateScreenData(element: any): ScreenData {
        const id = nanoid();
        const onLoad = element.onLoad || null;
        if (onLoad) {
            const loadingQueue = [...this.state.loadingQueue];
            loadingQueue.push(element.id);
            this.setState({ loadingQueue });
        }
        const state = onLoad ? ScreenDataState.Unloaded : ScreenDataState.Ready;
        if (typeof element === "string") {
            return { id, type: ScreenDataType.Text, text: element, state, onLoad };
        }
        if (!element.type) return;
        switch (element.type.toLowerCase()) {
            case "text": return { id, type: ScreenDataType.Text, text: element.text, className: element.className, state, onLoad };
            case "link": return { id, type: ScreenDataType.Link, target: element.target, className: element.className, text: element.text, state, onLoad };
            case "image":
            case "bitmap": return { id, type: ScreenDataType.Bitmap, src: element.src, alt: element.alt, className: element.className, state, onLoad };
            case "prompt": return { id, type: ScreenDataType.Prompt, prompt: element.prompt || PROMPT_DEFAULT, className: element.className, commands: element.commands, state, onLoad };
            case "toggle": return { id, type: ScreenDataType.Toggle, states: element.states, state };
            default: return;
        }
    }

    private _parseScreenContentElement(element: any): any {
        if (typeof element === "string") return element.split("\n");
        return element;
    }

    private _renderActiveElement(element: any, key: number): ReactElement {
        const type = element.type;
        if (type === ScreenDataType.Text || type === ScreenDataType.Link || type === ScreenDataType.Prompt) {
            const text = type === ScreenDataType.Prompt ? element.prompt : element.text;
            const handleRendered = () => this._activateNextScreenData();
            return <Teletype key={key} text={text} onComplete={handleRendered} onNewLine={this._handleTeletypeNewLine} autocomplete={false} className={element.className} />;
        }
        if (type === ScreenDataType.Toggle) {
            const text = element.states.find((item: any) => item.active === true).text;
            const handleRendered = () => this._activateNextScreenData();
            return <Teletype key={key} text={text} onComplete={handleRendered} onNewLine={this._handleTeletypeNewLine} autocomplete={false} className={element.className} />;
        }
        if (type === ScreenDataType.Bitmap) {
            const handleRendered = () => this._activateNextScreenData();
            return <Bitmap key={key} className={element.className} src={element.src} alt={element.alt} onComplete={handleRendered} />;
        }
        this._activateNextScreenData();
        return null;
    }

    private _renderStaticElement(element: any, key: number): ReactElement {
        const className = element.className || "";
        const handleRendered = () => this._setElementState(element.id, ScreenDataState.Done);
        if (element.type === ScreenDataType.Text) {
            const text = element.text.length ? element.text : "\0";
            return <Text key={key} className={className} text={text} onRendered={handleRendered} />;
        }
        if (element.type === ScreenDataType.Link) {
            return <Link key={key} text={element.text} target={element.target} className={className} onClick={this._handleLinkClick} onRendered={handleRendered} />;
        }
        if (element.type === ScreenDataType.Bitmap) {
            const onComplete = () => this._setElementState(element.id, ScreenDataState.Done);
            return <Bitmap key={key} className={className} src={element.src} alt={element.alt} onComplete={onComplete} autocomplete={true} />;
        }
        if (element.type === ScreenDataType.Prompt) {
            return <Prompt key={key} className={className} disabled={!!this.state.activeDialogId} prompt={element.prompt} commands={element.commands} onCommand={this._handlePromptCommand} />;
        }
        if (element.type === ScreenDataType.Toggle) {
            return <Toggle key={key} className={className} states={element.states} />;
        }
        return null;
    }

    private _changeScreen(targetScreen: string): void {
        this._unloadScreen();
        const screen = this._getScreen(targetScreen);
        const activeElement = screen.content[0];
        activeElement.state = ScreenDataState.Active;
        this.setState({ activeScreenId: targetScreen, activeElementId: activeElement.id, status: AppStatus.Active });
    }

    private _setElementState(id: string, state: ScreenDataState): void {
        const screen = this._getScreen(this.state.activeScreenId);
        const content = screen.content.find(element => element.id === id);
        if (content && content.state !== state) content.state = state;
    }

    private _unloadScreen(): void {
        const screen = this._getScreen(this.state.activeScreenId);
        screen.content.forEach(element => { element.state = ScreenDataState.Unloaded; });
    }

    private _getScreenDataById(id: string): any {
        const screen = this._getScreen(this.state.activeScreenId);
        return screen.content.find(element => element.id === id);
    }

    private _activateNextScreenData(): void {
        const screen = this._getScreen(this.state.activeScreenId);
        const activeIndex = screen.content.findIndex(element => element.state === ScreenDataState.Active);
        if (activeIndex === -1) return;
        screen.content[activeIndex].state = ScreenDataState.Done;
        if (activeIndex === screen.content.length - 1) {
            this.setState({ activeElementId: null, status: AppStatus.Done });
            return;
        }
        screen.content[activeIndex + 1].state = ScreenDataState.Active;
        this.setState({ activeElementId: screen.content[activeIndex + 1].id });
    }

    private _getActiveScreenData(): ScreenData {
        const screen = this._getScreen(this.state.activeScreenId);
        const activeIndex = screen.content.findIndex(element => element.state === ScreenDataState.Active);
        if (activeIndex > -1) return screen.content[activeIndex];
        const firstData = screen.content[0];
        if (firstData.state === ScreenDataState.Done || firstData.state === ScreenDataState.Unloaded) return null;
        firstData.state = ScreenDataState.Active;
        return firstData;
    }

    private _setActiveScreenDataByIndex(index: number): void {
        const screen = this._getScreen(this.state.activeScreenId);
        screen.content[index].state = ScreenDataState.Active;
    }

    private _toggleDialog(dialogId?: string): void {
        this.setState({ activeDialogId: dialogId || null });
    }

    private _handlePromptCommand(command: string, args?: any) {
        if (!args || !args.type) return;
        switch (args.type) {
            case "link": args.target && this._changeScreen(args.target); break;
            case "dialog": args.target && this._toggleDialog(args.target); break;
            case "console": console.log(command, args); break;
            default: break;
        }
    }

    private _renderDialog(): ReactElement {
        const { activeDialogId, dialogs } = this.state;
        if (!activeDialogId) return null;
        const dialog = dialogs.find(element => element.id === activeDialogId);
        if (!dialog) return null;
        const handleClose = () => this._toggleDialog();
        return <Modal text={dialog.content} onClose={handleClose} />;
    }

    private _handleTeletypeNewLine(): void { void 0; }

    private _handleLinkClick(target: string | any[], shiftKey: boolean): void {
        if (typeof target === "string") {
            this._changeScreen(target);
            return;
        }
        const linkTarget = (target as any[]).find(element => element.shiftKey === shiftKey);
        if (linkTarget) {
            if (linkTarget.type === "dialog") { this._toggleDialog(linkTarget.target); return; }
            if (linkTarget.type === "link") { this._changeScreen(linkTarget.target); return; }
        }
    }
}

export default Phosphor;
