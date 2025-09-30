import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/AuthService";

const store =configureStore({
    reducer:{
        auth:authReducer,
    }
})

export default store;