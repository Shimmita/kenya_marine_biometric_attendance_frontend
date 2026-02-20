import {
    configureStore
} from "@reduxjs/toolkit";
import {
    persistReducer,
    persistStore
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // using localStorage as the storage engine

import {
    combineReducers
} from "redux";

import currentUserReducer from "./CurrentUser";
import currentDeviceReducer from "./CurrentDevice";

// Configure persist settings
const persistConfig = {
    // Key to identify persisted data
    key: "root",
    storage,
};

// Combine all reducers
const rootReducer = combineReducers({
    currentUser: currentUserReducer,
    currentDevice:currentDeviceReducer
});

// Persist the root reducer for caching session states
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
const store = configureStore({
    reducer: persistedReducer,
});

// Create the persistor
const persistor = persistStore(store);

// Exporting both store and persistor for UI rehydration
export {
    persistor,
    store
};
