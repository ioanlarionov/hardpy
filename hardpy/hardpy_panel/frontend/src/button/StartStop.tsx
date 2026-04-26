// Copyright (c) 2024 Everypin
// GNU General Public License v3.0 (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)

import * as React from "react";
import { AnchorButton, AnchorButtonProps } from "@blueprintjs/core";
import { withTranslation, WithTranslation } from "react-i18next";

const startButtonSvg = `<svg width="146" height="48" viewBox="0 0 146 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.09815e-06" y="1.40113e-05" width="146" height="48" fill="#030213"/><path d="M59.2 30.176C58.24 30.176 57.4453 30.0373 56.816 29.76C56.1867 29.4827 55.7067 29.104 55.376 28.624C55.056 28.1333 54.864 27.5787 54.8 26.96H56.72C56.8053 27.3973 57.024 27.76 57.376 28.048C57.728 28.336 58.336 28.48 59.2 28.48C60.096 28.48 60.7307 28.336 61.104 28.048C61.488 27.7493 61.68 27.3867 61.68 26.96C61.68 26.608 61.5733 26.32 61.36 26.096C61.1467 25.872 60.816 25.68 60.368 25.52C59.9307 25.3493 59.3707 25.1947 58.688 25.056C57.92 24.8853 57.2693 24.672 56.736 24.416C56.2027 24.1493 55.7973 23.7973 55.52 23.36C55.2533 22.9227 55.12 22.3627 55.12 21.68C55.12 21.1147 55.2747 20.6027 55.584 20.144C55.8933 19.6853 56.3467 19.3173 56.944 19.04C57.552 18.7627 58.304 18.624 59.2 18.624C60.0747 18.624 60.8 18.7573 61.376 19.024C61.9627 19.28 62.4107 19.6373 62.72 20.096C63.04 20.5547 63.2267 21.0827 63.28 21.68H61.36C61.2747 21.2747 61.056 20.9493 60.704 20.704C60.3627 20.448 59.8613 20.32 59.2 20.32C58.432 20.32 57.8773 20.4533 57.536 20.72C57.2053 20.9867 57.04 21.3067 57.04 21.68C57.04 22.192 57.2533 22.576 57.68 22.832C58.1067 23.088 58.7627 23.3067 59.648 23.488C60.3093 23.6267 60.8853 23.792 61.376 23.984C61.8667 24.1653 62.2773 24.3893 62.608 24.656C62.9387 24.912 63.184 25.232 63.344 25.616C63.5147 25.9893 63.6 26.4373 63.6 26.96C63.6 27.5787 63.4347 28.1333 63.104 28.624C62.784 29.104 62.2987 29.4827 61.648 29.76C60.9973 30.0373 60.1813 30.176 59.2 30.176ZM68.33 30.08C67.69 30.08 67.1673 29.9893 66.762 29.808C66.3673 29.6267 66.074 29.344 65.882 28.96C65.7007 28.5653 65.61 28.0587 65.61 27.44V23.024H64.41V21.52H65.61V19.6H67.37V21.52H69.53V23.024H67.37V27.2C67.37 27.7013 67.4607 28.0533 67.642 28.256C67.834 28.448 68.1967 28.544 68.73 28.544C69.05 28.544 69.37 28.528 69.69 28.496V30C69.4873 30.0213 69.2793 30.0373 69.066 30.048C68.8527 30.0693 68.6073 30.08 68.33 30.08ZM73.6163 30.176C73.0083 30.176 72.4856 30.064 72.0483 29.84C71.6216 29.6053 71.2963 29.2853 71.0723 28.88C70.8483 28.4747 70.7363 28.0213 70.7363 27.52C70.7363 26.6773 70.9869 26.0533 71.4883 25.648C71.9896 25.232 72.7256 25.024 73.6963 25.024H76.3363V24.56C76.3363 23.92 76.1923 23.4827 75.9043 23.248C75.6269 23.0027 75.1843 22.88 74.5763 22.88C74.0323 22.88 73.6323 22.9653 73.3763 23.136C73.1203 23.3067 72.9709 23.5413 72.9283 23.84H71.2163C71.2483 23.3493 71.4029 22.9173 71.6803 22.544C71.9576 22.1707 72.3469 21.8773 72.8483 21.664C73.3603 21.4507 73.9629 21.344 74.6563 21.344C75.3496 21.344 75.9523 21.4507 76.4643 21.664C76.9869 21.8773 77.3869 22.2133 77.6643 22.672C77.9523 23.12 78.0963 23.7173 78.0963 24.464V27.84C78.0963 28.288 78.1016 28.6827 78.1123 29.024C78.1229 29.3547 78.1496 29.68 78.1923 30H76.5923C76.5603 29.7547 76.5336 29.5467 76.5123 29.376C76.5016 29.2053 76.4963 28.992 76.4963 28.736C76.2936 29.1307 75.9416 29.472 75.4403 29.76C74.9496 30.0373 74.3416 30.176 73.6163 30.176ZM74.0963 28.64C74.5016 28.64 74.8696 28.5707 75.2003 28.432C75.5416 28.2933 75.8136 28.0853 76.0163 27.808C76.2296 27.5307 76.3363 27.1947 76.3363 26.8V26.336H74.0163C73.5683 26.336 73.2056 26.432 72.9283 26.624C72.6616 26.816 72.5283 27.0987 72.5283 27.472C72.5283 27.824 72.6509 28.1067 72.8963 28.32C73.1523 28.5333 73.5523 28.64 74.0963 28.64ZM79.9413 30V21.52H81.5733V22.96C81.6906 22.6613 81.8506 22.3947 82.0533 22.16C82.2666 21.9147 82.5226 21.7173 82.8213 21.568C83.1306 21.4187 83.4773 21.344 83.8613 21.344C84.1279 21.344 84.3253 21.3547 84.4533 21.376C84.5919 21.3973 84.6879 21.4187 84.7413 21.44V23.04C84.5599 22.9867 84.3946 22.9493 84.2453 22.928C84.0959 22.896 83.9146 22.88 83.7013 22.88C83.2426 22.88 82.8639 22.9867 82.5653 23.2C82.2666 23.4027 82.0479 23.6693 81.9093 24C81.7706 24.32 81.7013 24.6667 81.7013 25.04V30H79.9413ZM89.4481 30.08C88.8081 30.08 88.2855 29.9893 87.8801 29.808C87.4855 29.6267 87.1921 29.344 87.0001 28.96C86.8188 28.5653 86.7281 28.0587 86.7281 27.44V23.024H85.5281V21.52H86.7281V19.6H88.4881V21.52H90.6481V23.024H88.4881V27.2C88.4881 27.7013 88.5788 28.0533 88.7601 28.256C88.9521 28.448 89.3148 28.544 89.8481 28.544C90.1681 28.544 90.4881 28.528 90.8081 28.496V30C90.6055 30.0213 90.3975 30.0373 90.1841 30.048C89.9708 30.0693 89.7255 30.08 89.4481 30.08Z" fill="#F9FAFB"/></svg>`;

type Props = {
  testing_status: string;
  useBigButton?: boolean;
  manualCollectMode?: boolean;
  onTestRunStart?: () => void;
} & WithTranslation;

type State = {
  isStopButtonDisabled: boolean;
};

// Global variables for ModalResult state
declare let isCompletionModalResultVisible: boolean;
declare let lastModalResultDismissTime: number;
declare const MODAL_RESULT_DISMISS_COOLDOWN: number;

/**
 * A React component that renders a start/stop button for controlling a testing process.
 * The button's behavior and appearance depend on the testing status.
 * Handles space key events for keyboard control and prevents actions during modal display.
 */
class StartStopButton extends React.Component<Props, State> {
  private stopButtonTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      isStopButtonDisabled: false,
    };

    this.hardpy_start = this.hardpy_start.bind(this);
    this.hardpy_stop = this.hardpy_stop.bind(this);
  }

  /**
   * Makes a fetch call to the specified URI.
   * @param {string} uri - The URI to which the fetch request is made.
   * @private
   */
  private hardpy_call(uri: string): void {
    fetch(uri).then((response) => {
      if (response.ok) {
        return response.text();
      }
    });
  }

  /**
   * Initiates the start process by making a call to the 'api/start' endpoint.
   * @private
   */
  private hardpy_start(): void {
    if (this.props.manualCollectMode) {
      return;
    }

    if (this.props.onTestRunStart) {
      this.props.onTestRunStart();
    }

    this.hardpy_call("api/start");
  }

  /**
   * Initiates the stop process by making a call to the 'api/stop' endpoint.
   * Temporarily disables the stop button to prevent multiple rapid clicks.
   * @private
   */
  private hardpy_stop(): void {
    if (this.props.manualCollectMode) {
      return;
    }

    if (this.state.isStopButtonDisabled) {
      return;
    }
    this.hardpy_call("api/stop");

    // Disable the stop button for some time to prevent multiple rapid clicks
    this.setState({ isStopButtonDisabled: true });
    this.stopButtonTimer = setTimeout(() => {
      this.setState({ isStopButtonDisabled: false });
    }, 500);
  }
  /**
   * Checks if any dialog is currently open in the application.
   * Searches for both Blueprint.js dialogs and standard ARIA dialogs.
   * @returns {boolean} True if a dialog is open and visible, false otherwise.
   */
  private isDialogOpen(): boolean {
    const blueprintDialogs = document.querySelectorAll(".bp3-dialog");
    for (const dialog of blueprintDialogs) {
      const style = window.getComputedStyle(dialog);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }

    const ariaDialogs = document.querySelectorAll('[role="dialog"]');
    for (const dialog of ariaDialogs) {
      const style = window.getComputedStyle(dialog);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the completion ModalResult is currently visible.
   * First attempts to use the global variable, falls back to DOM inspection.
   * @returns {boolean} True if the completion ModalResult is visible, false otherwise.
   */
  private isCompletionModalResultVisible(): boolean {
    try {
      if (typeof isCompletionModalResultVisible !== "undefined") {
        return isCompletionModalResultVisible;
      }
    } catch (error) {
      console.warn(
        "StartStopButton: Could not access global ModalResult visibility variable"
      );
    }

    // Fallback: check if ModalResult element exists in DOM by z-index
    const ModalResultElements = document.querySelectorAll(
      '[style*="z-index: 9999"]'
    );
    return ModalResultElements.length > 0;
  }

  /**
   * Checks if the application is in the cooldown period after ModalResult dismissal.
   * Prevents immediate space key actions after the ModalResult is dismissed.
   * @returns {boolean} True if within the cooldown period, false otherwise.
   */
  private isInModalResultDismissCooldown(): boolean {
    try {
      if (
        typeof lastModalResultDismissTime !== "undefined" &&
        typeof MODAL_RESULT_DISMISS_COOLDOWN !== "undefined"
      ) {
        const now = Date.now();
        return now - lastModalResultDismissTime < MODAL_RESULT_DISMISS_COOLDOWN;
      }
    } catch (error) {
      console.warn("StartStopButton: Could not access cooldown variables");
    }
    return false;
  }

  /**
   * Handles the space keydown event to start or stop the testing process.
   * Prevents space key actions when ModalResult is visible or during cooldown period.
   * Also prevents action when dialogs are open or interactive elements are focused.
   * @param {KeyboardEvent} event - The keyboard event object
   */
  private readonly handleSpaceKey = (event: KeyboardEvent): void => {
    // Only handle Space key, let other keys pass through
    if (event.key !== " ") {
      return;
    }

    if (this.props.manualCollectMode) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Check if completion ModalResult is visible
    if (this.isCompletionModalResultVisible()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Check if we're in cooldown period after ModalResult dismissal
    if (this.isInModalResultDismissCooldown()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Don't handle space if any dialog is open
    if (this.isDialogOpen()) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!target) {
      return;
    }

    // Don't handle space if focused on interactive elements
    const interactiveElements = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
    if (
      interactiveElements.includes(target.tagName) ||
      target.isContentEditable
    ) {
      return;
    }

    event.preventDefault();
    const is_testing_in_progress = this.props.testing_status == "run";
    is_testing_in_progress ? this.hardpy_stop() : this.hardpy_start();
  };

  /**
   * Handles the button click event to start the testing process.
   * Prevents button clicks when ModalResult is visible or during cooldown period.
   * @private
   */
  private readonly handleButtonClick = (): void => {
    if (this.props.manualCollectMode) {
      return;
    }

    // Check if completion ModalResult is visible
    if (this.isCompletionModalResultVisible()) {
      return;
    }

    // Check if we're in cooldown period after ModalResult dismissal
    if (this.isInModalResultDismissCooldown()) {
      return;
    }

    this.hardpy_start();
  };

  /**
   * Adds an event listener for the keydown event when the component is mounted.
   * Uses bubbling phase to not interfere with other capture phase listeners.
   */
  componentDidMount(): void {
    window.addEventListener("keydown", this.handleSpaceKey);
  }

  /**
   * Removes the event listener for the keydown event when the component is unmounted.
   * Also clears any pending timers to prevent memory leaks.
   */
  componentWillUnmount(): void {
    window.removeEventListener("keydown", this.handleSpaceKey);
    if (this.stopButtonTimer) {
      clearTimeout(this.stopButtonTimer);
    }
  }

  /**
   * Renders the Start/Stop button with appropriate properties based on the testing status.
   * Shows stop button when testing is in progress, start button otherwise.
   * @returns {React.ReactNode} The Start/Stop button component.
   */
  render(): React.ReactNode {
    const {
      t,
      testing_status,
      useBigButton = false,
      manualCollectMode = false,
    } = this.props;
    const is_testing: boolean = testing_status == "run";
    const button_id: string = "start-stop-button";

    if (useBigButton) {
      const bigButtonStyle = {
        width: "100%",
        height: "96px",
        fontSize: "24px",
        fontWeight: "bold",
        opacity: manualCollectMode ? 0.5 : 1,
      };

      const iconStyle = {
        fontSize: "28px",
        marginLeft: "12px",
      };

      const stop_button: AnchorButtonProps = {
        text: t("button.stop"),
        intent: "danger",
        large: true,
        rightIcon: <span style={iconStyle}>&#9632;</span>,
        onClick: this.hardpy_stop,
        id: button_id,
        fill: true,
        style: bigButtonStyle,
        disabled: manualCollectMode || this.state.isStopButtonDisabled,
      };

      const start_button: AnchorButtonProps = {
        text: "",
        intent: is_testing ? undefined : "primary",
        large: true,
        rightIcon: undefined,
        onClick: this.handleButtonClick,
        id: button_id,
        disabled: manualCollectMode || this.state.isStopButtonDisabled,
        fill: true,
        style: {
          ...bigButtonStyle,
          backgroundColor: 'transparent',
          backgroundImage: `url('data:image/svg+xml;base64,${btoa(startButtonSvg)}')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          border: 'none',
        },
      };

      return <AnchorButton {...(is_testing ? stop_button : start_button)} />;
    } else {
      const stop_button: AnchorButtonProps = {
        text: t("button.stop"),
        intent: "danger",
        large: true,
        rightIcon: "stop",
        onClick: this.hardpy_stop,
        id: button_id,
        disabled: manualCollectMode || this.state.isStopButtonDisabled,
      };

      const start_button: AnchorButtonProps = {
        text: t("button.start"),
        intent: is_testing ? undefined : "primary",
        large: true,
        rightIcon: "play",
        onClick: this.handleButtonClick,
        id: button_id,
        disabled: manualCollectMode || this.state.isStopButtonDisabled,
      };

      return <AnchorButton {...(is_testing ? stop_button : start_button)} />;
    }
  }
}

export default withTranslation()(StartStopButton);
