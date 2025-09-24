import {configureStore} from '@reduxjs/toolkit'
import todoreducer from '../Features/todo/todoSlice'

export const store =configureStore({
    reducer:todoreducer
})