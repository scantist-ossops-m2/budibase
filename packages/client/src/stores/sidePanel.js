import { writable, derived } from "svelte/store"

export const createSidePanelStore = () => {
  const initialState = {
    contentId: null,
    clickOutsideToClose: true,
  }
  const store = writable(initialState)
  const derivedStore = derived(store, $store => {
    return {
      ...$store,
      open: $store.contentId != null,
    }
  })
  let timeout

  const open = id => {
    clearTimeout(timeout)
    store.update(state => {
      state.contentId = id
      return state
    })
  }

  // Delay closing by 50ms to avoid toggling visibility when cycling though
  // records
  const close = () => {
    timeout = setTimeout(() => {
      store.update(state => {
        state.contentId = null
        return state
      })
    }, 50)
  }

  const setSidepanelState = bool => {
    clearTimeout(timeout)
    store.update(state => {
      state.clickOutsideToClose = bool
      return state
    })
  }
  return {
    subscribe: derivedStore.subscribe,
    actions: {
      open,
      close,
      setSidepanelState,
    },
  }
}

export const sidePanelStore = createSidePanelStore()
