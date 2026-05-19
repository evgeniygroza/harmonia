function createLifecycleStubs({ appName, version }) {
  const state = {
    appName,
    version,
    autoUpdate: {
      status: "placeholder",
      message: "Auto-update integration is prepared but not enabled."
    },
    crashReporting: {
      status: "placeholder",
      message: "Crash reporting hook is prepared but not connected to a provider."
    },
    codeSigning: {
      status: "placeholder",
      message: "Code signing is configured as a release checklist item."
    }
  };

  function init() {
    console.info(`[${appName}] lifecycle stubs ready`, {
      version,
      autoUpdate: state.autoUpdate.status,
      crashReporting: state.crashReporting.status,
      codeSigning: state.codeSigning.status
    });
  }

  function getStatus() {
    return {
      ...state,
      checkedAt: new Date().toISOString()
    };
  }

  return {
    init,
    getStatus
  };
}

module.exports = {
  createLifecycleStubs
};
