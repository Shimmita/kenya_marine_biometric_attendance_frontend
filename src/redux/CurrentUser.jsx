import { createSlice } from "@reduxjs/toolkit";

const initialstate = {
    user: null,
    isOnline: false,
    isGuest: true,
};

const currentUser = createSlice({
    name: "current_user_redux",
    initialState: initialstate,

    reducers: {
        // update  user and online status to true
        updateUserCurrentUserRedux: (state, action) => {
            state.user = action.payload;
            state.isOnline = true;
            state.isGuest = false
        },

        // nullify user and false online
        resetClearCurrentUserRedux: (state) => {
            state.user = null;
            state.isOnline = false;
            state.isGuest = true;
        },

    },
});

// exporting actions
export const {
    updateUserCurrentUserRedux,
    resetClearCurrentUserRedux,
} = currentUser.actions;

// exporting the main fun reducer
export default currentUser.reducer;
