import {create} from "zustand";

export const useCallStore  = create((set,get)=>({
    incomingCall: null,
    activeCall: null,
    setIncomingCall: (c) => set({incomingCall:c}),
    clearIncomingCall: () => set({incomingCall: null}),
    setActiveCall: (c) => set({activeCall: c}),
    clearActiveCall: () => set({activeCall: null}),
}))