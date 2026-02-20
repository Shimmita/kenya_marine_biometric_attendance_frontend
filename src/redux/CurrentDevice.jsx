import { createSlice } from "@reduxjs/toolkit";

const initialstate = {
    device: null,
};

const currentDevice = createSlice({
    name: "current_device_redux",
    initialState: initialstate,

    reducers: {
        // update  user and online status to true
        updateUserCurrentDeviceRedux: (state, action) => {
            state.device = action.payload;
        },

        // nullify user and false online
        resetClearCurrentDeviceRedux: (state) => {
            state.device = null;
        },

    },
});

// exporting actions
export const {
    updateUserCurrentDeviceRedux,
    resetClearCurrentDeviceRedux,
} = currentDevice.actions;

// exporting the main fun reducer
export default currentDevice.reducer;
