const live2dUnavailableMessage =
  'Live2D runtime is not bundled with this demo. The app will use the built-in fallback avatar.'

export const LAppDefine = {
  PriorityNormal: 1,
  setResourcesPath() {}
}

export const LAppDelegate = {
  getInstance() {
    throw new Error(live2dUnavailableMessage)
  }
}
