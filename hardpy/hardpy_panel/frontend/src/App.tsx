// Copyright (c) 2024 Everypin
// GNU General Public License v3.0 (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)

import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  Button,
  Menu,
  MenuItem,
  H2,
  Popover,
  Card,
} from "@blueprintjs/core";

import StartStopButton from "./button/StartStop";
import { TestRunI } from "./hardpy_test_view/SuiteList";
import SuiteList from "./hardpy_test_view/SuiteList";
import ProgressView from "./progress/ProgressView";
import TestStatus from "./hardpy_test_view/TestStatus";
import ReloadAlert from "./restart_alert/RestartAlert";
import PlaySound from "./hardpy_test_view/PlaySound";
import TestConfigOverlay from "./hardpy_test_view/TestConfigOverlay";
import TestCompletionModalResult from "./hardpy_test_view/TestCompletionModalResult";

import { useStorageData } from "./hooks/useStorageData";

import "./App.css";

const WINDOW_WIDTH_THRESHOLDS = {
  ULTRAWIDE: 490,
  WIDE: 400,
};

const STATUS_MAP = {
  ready: "app.status.ready",
  run: "app.status.run",
  passed: "app.status.passed",
  failed: "app.status.failed",
  stopped: "app.status.stopped",
} as const;

type StatusKey = keyof typeof STATUS_MAP;

interface AppConfig {
  frontend?: {
    full_size_button?: boolean;
    sound_on?: boolean;
    manual_collect?: boolean;
    measurement_display?: boolean;
    modal_result?: {
      enable?: boolean;
      auto_dismiss_pass?: boolean;
      auto_dismiss_timeout?: number;
    };
  };
  current_test_config?: string;
  test_configs?: Array<{
    name: string;
    description: string;
    file?: string;
  }>;
}

/**
 * Checks if the provided status is a valid status key.
 * @param {string} status - The status string to validate
 * @returns {boolean} True if the status is a valid StatusKey, false otherwise
 */
const isValidStatus = (status: string): status is StatusKey => {
  return status in STATUS_MAP;
};

// Global variable to track ModalResult visibility with timestamp
let isCompletionModalResultVisible = false;
let lastModalResultDismissTime = 0;
const MODAL_RESULT_DISMISS_COOLDOWN = 100; // ms

/**
 * Sets the global ModalResult visibility state and updates dismissal timestamp
 * @param {boolean} visible - The visibility state to set
 */
export const setCompletionModalResultVisible = (visible: boolean): void => {
  isCompletionModalResultVisible = visible;
  if (!visible) {
    lastModalResultDismissTime = Date.now();
  }
};

/**
 * Gets the global ModalResult visibility state
 * @returns {boolean} Current visibility state of the completion ModalResult
 */
export const getCompletionModalResultVisible = (): boolean => {
  return isCompletionModalResultVisible;
};

/**
 * Checks if we're in cooldown period after ModalResult dismissal
 * Prevents immediate space key actions after ModalResult is dismissed
 * @returns {boolean} True if within the cooldown period, false otherwise
 */
export const isInModalResultDismissCooldown = (): boolean => {
  const now = Date.now();
  return now - lastModalResultDismissTime < MODAL_RESULT_DISMISS_COOLDOWN;
};

/**
 * Finds the test case that was stopped during test execution
 * Searches through all modules and cases to find the stopped test case
 * @param {TestRunI} testRunData - The test run data to search through
 * @returns {Object|undefined} Object containing module name, case name, and optional assertion message, or undefined if not found
 */
const findStoppedTestCase = (
  testRunData: TestRunI
):
  | { moduleName: string; caseName: string; assertionMsg?: string }
  | undefined => {
  if (!testRunData.modules) {
    return undefined;
  }

  // First, look for explicitly stopped test cases
  for (const [moduleId, module] of Object.entries(testRunData.modules)) {
    if (module.cases) {
      for (const [caseId, testCase] of Object.entries(module.cases)) {
        if (testCase.status === "stopped") {
          return {
            moduleName: module.name || moduleId,
            caseName: testCase.name || caseId,
            assertionMsg: testCase.assertion_msg || undefined,
          };
        }
      }
    }
  }

  // If no explicitly stopped case found, return the last failed test case
  let lastFailedTestCase: {
    moduleName: string;
    caseName: string;
    assertionMsg?: string;
  } | null = null;
  for (const [moduleId, module] of Object.entries(testRunData.modules)) {
    if (module.cases) {
      for (const [caseId, testCase] of Object.entries(module.cases)) {
        if (testCase.status === "failed") {
          lastFailedTestCase = {
            moduleName: module.name || moduleId,
            caseName: testCase.name || caseId,
            assertionMsg: testCase.assertion_msg || undefined,
          };
        }
      }
    }
  }

  return lastFailedTestCase || undefined;
};

/**
 * Main application component for the HardPy testing interface
 * Provides the main GUI for test execution, monitoring, and result display
 * @param {Object} props - Component properties
 * @param {string} props.syncDocumentId - The id of the PouchDB document to synchronize with
 * @returns {JSX.Element} The main application component
 */
function App({ syncDocumentId }: { syncDocumentId: string }): JSX.Element {
  const { t } = useTranslation();
  const [use_end_test_sound, setUseEndTestSound] = React.useState(false);
  const [use_debug_info, setUseDebugInfo] = React.useState(false);
  const [appConfig, setAppConfig] = React.useState<AppConfig | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = React.useState(false);
  const [manualCollectMode, setManualCollectMode] = React.useState(false);

  const [lastRunStatus, setLastRunStatus] = React.useState<
    StatusKey | "unknown"
  >("ready");
  const [lastProgress, setProgress] = React.useState(0);
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [lastRunDuration, setLastRunDuration] = React.useState<number>(0);

  // Test config selection state
  const [showConfigOverlay, setShowConfigOverlay] = React.useState(false);

  // Test completion ModalResult state
  const [showCompletionModalResult, setShowCompletionModalResult] =
    React.useState(false);
  const [testCompletionData, setTestCompletionData] = React.useState<{
    testPassed: boolean;
    testStopped: boolean;
    failedTestCases: Array<{
      moduleName: string;
      caseName: string;
      assertionMsg?: string;
    }>;
    stoppedTestCase?: {
      moduleName: string;
      caseName: string;
      assertionMsg?: string;
    };
  } | null>(null);

  const startTimeRef = React.useRef<number | null>(null);
  const [timerIntervalId, setTimerIntervalId] =
    React.useState<NodeJS.Timeout | null>(null);
  const [allTests, setAllTests] = React.useState<string[]>([]);
  const [previousTestStructure, setPreviousTestStructure] =
    React.useState<string>("");
  let [selectedTests, setSelectedTests] = React.useState<string[]>([]);

  /**
   * Loads HardPy configuration from the backend API on component mount
   * Initializes frontend configurations
   */
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/hardpy_config");
        const config = await response.json();
        setAppConfig(config);

        // Initialize sound setting from TOML config
        if (config.frontend?.sound_on !== undefined) {
          setUseEndTestSound(config.frontend.sound_on);
        }

        // Load manual collect mode state
        const manualCollectResponse = await fetch("/api/manual_collect_mode");
        const manualCollectData = await manualCollectResponse.json();
        setManualCollectMode(manualCollectData.manual_collect_mode);

        if (config.frontend?.manual_collect) {
          const savedTests = localStorage.getItem("hardpy_selected_tests");
          if (savedTests) {
            setSelectedTests(JSON.parse(savedTests));
          }
        }

        // Show overlay if no current test config is selected
        if (
          !config.current_test_config &&
          config.test_configs &&
          config.test_configs.length > 0
        ) {
          setShowConfigOverlay(true);
        }
      } catch (error) {
        console.error("Failed to load HardPy config:", error);
      } finally {
        setIsConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  /**
   * Toggles manual collect mode
   */
  const toggleManualCollectMode = async () => {
    try {
      const newMode = !manualCollectMode;
      const response = await fetch("/api/manual_collect_mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: newMode }),
      });

      const result = await response.json();
      if (result.status === "success") {
        setManualCollectMode(newMode);
      }

      if (result.manual_collect_mode === false) {
        const testsToSend = selectedTests || [];
        const testsJsonString = JSON.stringify(testsToSend);

        fetch(`/api/selected_tests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: testsJsonString,
        }).then((response) => response.json());
      }
    } catch (error) {
      console.error("Failed to toggle manual collect mode:", error);
    }
  };

  /**
   * Filters selected tests to only include those that exist in current test structure
   */
  const filterSelectedTests = React.useCallback((currentAllTests: string[]) => {
    setSelectedTests((prevSelected) => {
      const filtered = prevSelected.filter((test) =>
        currentAllTests.includes(test)
      );

      if (JSON.stringify(filtered) !== JSON.stringify(prevSelected)) {
        localStorage.setItem("hardpy_selected_tests", JSON.stringify(filtered));
      }

      return filtered;
    });
  }, []);

  /**
   * Handler for test config selection
   */
  const handleConfigSelection = async (configName: string) => {
    // Prevent config changes during test runs
    if (lastRunStatus === "run") {
      console.warn("Cannot change test config while test is running");
      return;
    }

    try {
      // Update the backend with the selected config
      const response = await fetch(
        `/api/set_test_config/${encodeURIComponent(configName)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Update local state
        setAppConfig((prev) =>
          prev ? { ...prev, current_test_config: configName } : null
        );
        setShowConfigOverlay(false);
      } else {
        console.error("Failed to set test config");
      }
    } catch (error) {
      console.error("Error setting test config:", error);
    }
  };

  /**
   * Custom hook to determine if the window width is greater than a specified size
   * @param {number} size - The width threshold to compare against in pixels
   * @returns {boolean} True if the window width is greater than the specified size, otherwise false
   */
  const useWindowWide = (size: number): boolean => {
    const [width, setWidth] = React.useState(0);

    React.useEffect(() => {
      /**
       * Updates the current window width state
       */
      function handleResize() {
        setWidth(window.innerWidth);
      }

      window.addEventListener("resize", handleResize);
      handleResize();

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [setWidth]);

    return width > size;
  };

  const ultrawide = useWindowWide(WINDOW_WIDTH_THRESHOLDS.ULTRAWIDE);
  const wide = useWindowWide(WINDOW_WIDTH_THRESHOLDS.WIDE);

  /**
   * Handles ModalResult visibility changes and updates global state
   */
  const handleModalResultVisibilityChange = React.useCallback(
    (isVisible: boolean) => {
      setCompletionModalResultVisible(isVisible);
    },
    []
  );

  /**
   * Handles keyboard events for ModalResult dismissal
   * Prevents space key propagation and dismisses ModalResult on any key press
   */
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showCompletionModalResult) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        setShowCompletionModalResult(false);
        setTestCompletionData(null);

        // Additional handling for space key to prevent focus issues
        if (event.key === " ") {
          event.preventDefault();
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
        }
      }
    };

    if (showCompletionModalResult) {
      document.addEventListener("keydown", handleKeyDown, {
        capture: true,
        passive: false,
      });
      return () => {
        document.removeEventListener("keydown", handleKeyDown, {
          capture: true,
        });
      };
    }
  }, [showCompletionModalResult]);

  /**
   * Close config overlay when test starts running
   */
  React.useEffect(() => {
    if (lastRunStatus === "run" && showConfigOverlay) {
      setShowConfigOverlay(false);
    }
  }, [lastRunStatus, showConfigOverlay]);

  /**
   * Manages test execution timer and duration calculation
   * Updates the test duration every second while test is running
   */
  React.useEffect(() => {
    if (lastRunStatus === "run") {
      if (startTimeRef.current !== null) {
        /**
         * Updates the test duration by calculating difference from start time
         */
        const updateDuration = () => {
          const currentTimeInSeconds = Math.floor(Date.now() / 1000);
          setLastRunDuration(currentTimeInSeconds - startTimeRef.current!);
        };

        updateDuration();

        const id = setInterval(updateDuration, 1000);
        setTimerIntervalId(id);

        return () => {
          if (id) {
            clearInterval(id);
          }
        };
      }
    } else if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
  }, [lastRunStatus]);

  /**
   * Finds the index of a row in a list based on its ID
   * @param {Array} rows - The list of rows to search
   * @param {string} searchTerm - The ID to search for
   * @returns {number} The index of the row, or -1 if not found
   */
  function findRowIndex(rows: { id: string }[], searchTerm: string): number {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === searchTerm) {
        return i;
      }
    }
    return -1;
  }

  const { rows, state, loading, error } = useStorageData();

  /**
   * Monitors database changes and updates application state accordingly
   * Handles test status changes, progress updates, and ModalResult display
   */
  React.useEffect(() => {
    if (rows.length === 0) {
      return;
    }

    const index = findRowIndex(rows, syncDocumentId);
    if (index === -1) {
      return;
    }
    const db_row = rows[index].doc as TestRunI;
    const status = db_row.status || "";
    const progress = db_row.progress || 0;

    // Update run status if changed
    if (status !== lastRunStatus) {
      setLastRunStatus(isValidStatus(status) ? status : "unknown");
    }

    // Update progress if changed
    if (progress !== lastProgress) {
      setProgress(progress);
    }

    // Update start time and calculate duration
    if (db_row.start_time) {
      startTimeRef.current = db_row.start_time;

      if (db_row.stop_time && status !== "run") {
        const duration = db_row.stop_time - db_row.start_time;
        if (duration !== lastRunDuration) {
          setLastRunDuration(duration);
        }
      }
    }

    // Extract all available tests and detect structure changes
    if (db_row.modules) {
      const allAvailableTests: string[] = [];
      Object.entries(db_row.modules).forEach(([moduleId, module]) => {
        if (module.cases) {
          Object.keys(module.cases).forEach((caseId) => {
            // Safe check for case existence
            if (module.cases[caseId]) {
              allAvailableTests.push(`${moduleId}::${caseId}`);
            }
          });
        }
      });

      const currentStructure = JSON.stringify(allAvailableTests);

      // Sort selected tests by Available tests order
      const selectedTestsSet = new Set(selectedTests);
      selectedTests = allAvailableTests.filter((test) =>
        selectedTestsSet.has(test)
      );

      if (currentStructure !== previousTestStructure) {
        setAllTests(allAvailableTests);
        setPreviousTestStructure(currentStructure);

        // Filter selected tests when test structure changes
        filterSelectedTests(allAvailableTests);
      }

      // If manual selection is enabled and no tests are selected yet, select all by default
      if (
        appConfig?.frontend?.manual_collect &&
        selectedTests.length === 0 &&
        allAvailableTests.length > 0
      ) {
        setSelectedTests(allAvailableTests);
        localStorage.setItem(
          "hardpy_selected_tests",
          JSON.stringify(allAvailableTests)
        );
      }
    }

    const prevStatus = lastRunStatus;
    const ModalResultEnable =
      appConfig?.frontend?.modal_result?.enable ?? false;

    // Close ModalResult when test starts running (status changes to "run")
    if (prevStatus !== "run" && status === "run" && showCompletionModalResult) {
      setShowCompletionModalResult(false);
      setTestCompletionData(null);
    }

    // Show ModalResult on test completion
    if (
      ModalResultEnable &&
      prevStatus === "run" &&
      (status === "passed" || status === "failed" || status === "stopped") &&
      !showCompletionModalResult
    ) {
      const testPassed = status === "passed";
      const testStopped = status === "stopped";
      const failedTestCases: Array<{
        moduleName: string;
        caseName: string;
        assertionMsg?: string;
      }> = [];

      if (!testPassed && !testStopped && db_row.modules) {
        Object.entries(db_row.modules).forEach(([moduleId, module]) => {
          if (module.cases) {
            Object.entries(module.cases).forEach(([caseId, testCase]) => {
              if (testCase.status === "failed") {
                failedTestCases.push({
                  moduleName: module.name || moduleId,
                  caseName: testCase.name || caseId,
                  assertionMsg: testCase.assertion_msg || undefined,
                });
              }
            });
          }
        });
      }

      const stoppedTestCase = testStopped
        ? findStoppedTestCase(db_row)
        : undefined;

      setTestCompletionData({
        testPassed,
        testStopped,
        failedTestCases,
        stoppedTestCase,
      });
      setShowCompletionModalResult(true);
    }

    // Handle authentication state based on database connection
    if (state === "error") {
      setIsAuthenticated(false);
    } else if (isAuthenticated === false) {
      setIsAuthenticated(true);
    }
  }, [
    rows,
    state,
    lastRunStatus,
    lastProgress,
    lastRunDuration,
    isAuthenticated,
    appConfig,
    showCompletionModalResult,
    syncDocumentId,
    selectedTests.length,
    previousTestStructure,
    filterSelectedTests,
  ]);

  /**
   * Handles selection change from SuiteList
   */
  const handleTestsSelectionChange = (tests: string[]) => {
    setSelectedTests(tests);
    localStorage.setItem("hardpy_selected_tests", JSON.stringify(tests));
  };

  /**
   * Clears selected tests when starting a new test run
   */
  const handleTestRunStart = React.useCallback(() => {
    filterSelectedTests(allTests);
  }, [allTests, filterSelectedTests]);

  /**
   * Renders the database content including test suites and debug information
   * @returns {JSX.Element} The rendered database content component
   */
  const renderDbContent = (): JSX.Element => {
    if (loading && rows.length === 0) {
      return (
        <Card style={{ marginTop: "60px" }}>
          <H2>{t("app.connection")}</H2>
        </Card>
      );
    }

    if (state === "error") {
      return (
        <Card style={{ marginTop: "60px" }}>
          <H2>{t("app.dbError")}</H2>
          {error && <p>{error.message}</p>}
        </Card>
      );
    }

    if (rows.length === 0) {
      return (
        <Card style={{ marginTop: "60px" }}>
          <H2>{t("app.noEntries")}</H2>
        </Card>
      );
    }

    const index = findRowIndex(rows, syncDocumentId);
    if (index === -1) {
      return (
        <Card style={{ marginTop: "60px" }}>
          <H2>{t("app.dbError")}</H2>
          {error && <p>{error.message}</p>}
        </Card>
      );
    }

    const document_row = rows[index];

    if (!document_row) {
      return (
        <Card style={{ marginTop: "60px" }}>
          <H2>{t("app.dbError")}</H2>
          {error && <p>{error.message}</p>}
        </Card>
      );
    }

    const testRunData: TestRunI = document_row.doc as TestRunI;

    return (
      <div className="page-section" style={{ marginTop: "40px" }}>
        <div className="page-title-wrapper">
          <h1 className="page-title">{testRunData.name}</h1>
          {appConfig?.current_test_config && (
            <div className="page-config-label">{appConfig.current_test_config}</div>
          )}
        </div>
        <div
          key={document_row.id}
          className="page-content-row"
        >
          {(ultrawide || !use_debug_info) && (
            <div className="suite-card">
              <SuiteList
                db_state={testRunData}
                defaultClose={!ultrawide}
                onTestsSelectionChange={handleTestsSelectionChange}
                selectedTests={selectedTests}
                selectionSupported={
                  (appConfig?.frontend?.manual_collect || false) &&
                  manualCollectMode
                }
                currentTestConfig={appConfig?.current_test_config}
                measurementDisplay={appConfig?.frontend?.measurement_display}
                manualCollectMode={manualCollectMode}
              />
            </div>
          )}
          {use_debug_info && (
            <Card
              style={{
                flexDirection: "column",
                padding: "20px",
                marginTop: "20px",
                marginBottom: "20px",
              }}
            >
              <pre>{JSON.stringify(testRunData, null, 2)}</pre>
            </Card>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders the settings menu with sound and debug options
   * @returns {JSX.Element} The settings menu component
   */
  const renderSettingsMenu = (): JSX.Element => {
    return (
      <Menu>
        <MenuItem
          shouldDismissPopover={false}
          text={use_end_test_sound ? t("app.soundOff") : t("app.soundOn")}
          icon={use_end_test_sound ? "volume-up" : "volume-off"}
          id="use_end_test_sound"
          onClick={() => setUseEndTestSound(!use_end_test_sound)}
        />
        <MenuItem
          shouldDismissPopover={false}
          text={use_debug_info ? t("app.debugOff") : t("app.debugOn")}
          icon={"bug"}
          id="use_debug_info"
          onClick={() => setUseDebugInfo(!use_debug_info)}
        />
        {appConfig?.frontend?.manual_collect && (
          <MenuItem
            shouldDismissPopover={false}
            text={
              manualCollectMode
                ? t("app.manualCollectOff")
                : t("app.manualCollectOn")
            }
            icon={manualCollectMode ? "disable" : "selection"}
            onClick={toggleManualCollectMode}
          />
        )}
      </Menu>
    );
  };

  /**
   * Renders the status text of the test run based on the current status
   * @param {StatusKey | "unknown"} status - The status to render
   * @returns {string} The translated status text
   */
  const getStatusText = (status: StatusKey | "unknown"): string => {
    if (status === "unknown") {
      return t("app.status.unknown") || "Unknown status";
    }
    return t(STATUS_MAP[status]);
  };

  const useBigButton = appConfig?.frontend?.full_size_button !== false;

  /**
   * Handles ModalResult dismissal by hiding it and clearing completion data
   */
  const handleModalResultDismiss = () => {
    setShowCompletionModalResult(false);
    setTestCompletionData(null);
  };

  return (
    <div className="App">
      <ReloadAlert reload_timeout_s={3} />

      {/* Header with navigation and status information */}
      <div className="app-header">
        <div className="app-header-left">
          <div className="app-brand">
            <div className="app-brand-name">
              <svg width="112" height="28" viewBox="0 0 112 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.98313 21V1.16869H7.08261V8.70459H14.4485V1.16869H19.548V21H14.4485V12.8975H7.08261V21H1.98313ZM26.4823 21.3683C25.4058 21.3683 24.4803 21.1605 23.7059 20.745C22.9505 20.3295 22.3744 19.7629 21.9778 19.0452C21.5812 18.3086 21.3828 17.4965 21.3828 16.6088C21.3828 15.1167 21.8361 13.974 22.7427 13.1808C23.6682 12.3875 25.0564 11.9909 26.9073 11.9909H31.1568V11.3676C31.1568 10.4611 30.9396 9.83781 30.5052 9.49784C30.0897 9.15787 29.5042 8.98789 28.7488 8.98789C28.0311 8.98789 27.5022 9.10121 27.1623 9.32786C26.8223 9.53561 26.6334 9.88502 26.5956 10.3761H22.2328C22.2894 9.46951 22.5727 8.65737 23.0827 7.93967C23.6115 7.22196 24.3575 6.65535 25.3208 6.23984C26.3029 5.82433 27.4928 5.61657 28.8904 5.61657C30.2125 5.61657 31.374 5.81488 32.3751 6.21151C33.3761 6.60813 34.1504 7.25029 34.6982 8.13798C35.2648 9.00678 35.5481 10.1778 35.5481 11.651V17.1754C35.5481 17.9686 35.567 18.6675 35.6047 19.2718C35.6425 19.8573 35.6992 20.4334 35.7747 21H31.6101C31.5912 20.6789 31.5629 20.3956 31.5251 20.1501C31.5063 19.9046 31.4968 19.6024 31.4968 19.2435C31.0435 19.8479 30.4108 20.3578 29.5987 20.7734C28.8054 21.17 27.7666 21.3683 26.4823 21.3683ZM27.8988 18.2803C28.5221 18.2803 29.0793 18.167 29.5703 17.9403C30.0614 17.7137 30.4486 17.3737 30.7319 16.9204C31.0152 16.4482 31.1568 15.9194 31.1568 15.3339V14.7106H27.7572C27.115 14.7106 26.6334 14.8806 26.3123 15.2206C26.0102 15.5606 25.8591 15.9477 25.8591 16.3821C25.8591 16.9487 26.0102 17.4115 26.3123 17.7703C26.6334 18.1103 27.1623 18.2803 27.8988 18.2803ZM37.6751 21V5.98486H41.698V8.02466C41.8491 7.68469 42.1041 7.32584 42.4629 6.9481C42.8218 6.57036 43.2562 6.25873 43.7661 6.01319C44.2761 5.74878 44.8427 5.61657 45.4659 5.61657C45.787 5.61657 46.042 5.63546 46.2309 5.67323C46.4197 5.711 46.5897 5.74878 46.7408 5.78655V9.5545C46.6464 9.49784 46.4292 9.43174 46.0892 9.35619C45.7492 9.28064 45.3621 9.24287 44.9277 9.24287C44.2477 9.24287 43.6906 9.37507 43.2562 9.63949C42.8406 9.90391 42.529 10.2628 42.3213 10.716C42.1324 11.1693 42.038 11.6793 42.038 12.2459V21H37.6751ZM53.6251 21.3683C52.3219 21.3683 51.1792 21.0755 50.1971 20.4901C49.2339 19.9046 48.4878 19.0452 47.959 17.912C47.4302 16.7599 47.1658 15.3339 47.1658 13.6341V13.0675C47.1658 11.4432 47.4207 10.0833 47.9307 8.98789C48.4406 7.87356 49.1772 7.03309 50.1405 6.46648C51.1037 5.89987 52.2652 5.61657 53.6251 5.61657C54.475 5.61657 55.2777 5.81488 56.0332 6.21151C56.8076 6.58925 57.4497 7.14641 57.9597 7.883V1.16869H62.3225V21H58.2996V18.9602C57.9219 19.5646 57.3269 20.1218 56.5148 20.6317C55.7216 21.1228 54.7583 21.3683 53.6251 21.3683ZM54.6733 17.7703C55.2966 17.7703 55.8538 17.6287 56.3448 17.3454C56.8359 17.0432 57.2231 16.6182 57.5064 16.0705C57.8086 15.5039 57.9597 14.8334 57.9597 14.059V12.6425C57.9597 11.887 57.8086 11.2543 57.5064 10.7444C57.2231 10.2344 56.8359 9.85669 56.3448 9.61116C55.8538 9.34674 55.2966 9.21454 54.6733 9.21454C53.7856 9.21454 53.0585 9.53561 52.4919 10.1778C51.9253 10.801 51.642 11.7643 51.642 13.0675V13.6341C51.642 14.9939 51.9253 16.0233 52.4919 16.7221C53.0774 17.4209 53.8045 17.7703 54.6733 17.7703ZM64.5956 26.6661V5.98486H68.6185V8.02466C69.0152 7.42027 69.6007 6.87255 70.375 6.38149C71.1683 5.87154 72.141 5.61657 73.2931 5.61657C75.4084 5.61657 77.0138 6.23984 78.1092 7.48638C79.2047 8.73292 79.7524 10.5933 79.7524 13.0675V13.6341C79.7524 15.3339 79.488 16.7599 78.9592 17.912C78.4303 19.0452 77.6843 19.9046 76.7211 20.4901C75.7578 21.0755 74.6152 21.3683 73.2931 21.3683C72.4432 21.3683 71.631 21.1794 70.8567 20.8017C70.1012 20.4051 69.4685 19.8385 68.9585 19.1019V26.6661H64.5956ZM72.2448 17.7703C73.1136 17.7703 73.8313 17.4209 74.398 16.7221C74.9835 16.0044 75.2762 14.9751 75.2762 13.6341V13.0675C75.2762 11.7643 74.9929 10.801 74.4263 10.1778C73.8786 9.53561 73.1514 9.21454 72.2448 9.21454C71.6405 9.21454 71.0833 9.34674 70.5733 9.61116C70.0823 9.85669 69.6857 10.2344 69.3835 10.7444C69.1002 11.2543 68.9585 11.887 68.9585 12.6425V14.059C68.9585 14.8334 69.1002 15.5039 69.3835 16.0705C69.6857 16.6182 70.0823 17.0432 70.5733 17.3454C71.0833 17.6287 71.6405 17.7703 72.2448 17.7703ZM83.8802 27.0344C83.5969 27.0344 83.3136 27.0061 83.0303 26.9494V23.3231C83.3136 23.3798 83.5969 23.4081 83.8802 23.4081C84.258 23.4081 84.5696 23.3231 84.8152 23.1531C85.0607 23.002 85.2779 22.747 85.4668 22.3882C85.6745 22.0293 85.8917 21.5572 86.1184 20.9717L79.7723 5.98486H84.5885L88.3281 15.9855L91.8694 5.98486H96.204L90.4812 21C89.9146 22.4165 89.3764 23.5686 88.8664 24.4563C88.3565 25.3629 87.7143 26.0145 86.9399 26.4111C86.1845 26.8266 85.1646 27.0344 83.8802 27.0344Z" fill="#E05FF6"/>
                <circle cx="109.625" cy="2.375" r="2.375" fill="#E05FF6"/>
                <circle cx="109.625" cy="8.12509" r="2.375" fill="#E05FF6"/>
                <circle cx="109.625" cy="13.8752" r="2.375" fill="#E05FF6"/>
                <circle cx="109.625" cy="19.6242" r="2.375" fill="#E05FF6"/>
              </svg>
            </div>
            <span className="app-brand-subtitle">Operator Panel</span>
          </div>
        </div>
        <div className="app-header-right">
          <a href="https://github.com/everypinio/hardpy" target="_blank" className="header-star-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.765 21.8 24 17.302 24 12c0-6.627-5.373-12-12-12z" fill="#4e4e66"/>
            </svg>
            <span>60</span>
          </a>
          <Popover content={renderSettingsMenu()} position="bottom" portalClassName="settings-menu-portal">
            <Button className="bp3-minimal header-icon-button" icon={
              <svg width="5" height="22" viewBox="0 0 5 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="2.375" cy="2.375" r="2.375" fill="#030213"/>
                <circle cx="2.375" cy="8.12509" r="2.375" fill="#030213"/>
                <circle cx="2.375" cy="13.8752" r="2.375" fill="#030213"/>
                <circle cx="2.375" cy="19.6242" r="2.375" fill="#030213"/>
              </svg>
            } />
          </Popover>
        </div>
      </div>

      {/* Main content area with test suites and results */}
      <div className="app-content" style={{ paddingBottom: useBigButton ? "140px" : "100px" }}>
        {renderDbContent()}
      </div>

      {/* Footer with progress bar and control buttons */}
      {isConfigLoaded && (
        <div className="app-footer">
          <div className="app-footer-progress">
            <ProgressView percentage={lastProgress} status={lastRunStatus} />
          </div>
          <div className="app-footer-action">
            <StartStopButton
              testing_status={lastRunStatus}
              useBigButton={true}
              manualCollectMode={manualCollectMode}
              onTestRunStart={handleTestRunStart}
            />
          </div>
        </div>
      )}

      {/* Test Config Selection Overlay */}
      {appConfig && (
        <TestConfigOverlay
          isOpen={showConfigOverlay}
          testConfigs={appConfig.test_configs || []}
          currentConfig={appConfig.current_test_config}
          isTestRunning={lastRunStatus === "run"}
          onSelect={handleConfigSelection}
          onClose={() => setShowConfigOverlay(false)}
        />
      )}

      {/* Test Completion ModalResult */}
      <TestCompletionModalResult
        isVisible={showCompletionModalResult}
        testPassed={testCompletionData?.testPassed || false}
        testStopped={testCompletionData?.testStopped || false}
        failedTestCases={testCompletionData?.failedTestCases || []}
        stoppedTestCase={testCompletionData?.stoppedTestCase}
        onDismiss={handleModalResultDismiss}
        onVisibilityChange={handleModalResultVisibilityChange}
        autoDismissPass={
          appConfig?.frontend?.modal_result?.auto_dismiss_pass ?? true
        }
        autoDismissTimeout={
          appConfig?.frontend?.modal_result?.auto_dismiss_timeout ?? 5
        }
      />
    </div>
  );
}

export default App;
