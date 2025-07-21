// store/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  adminInfo: JSON.parse(localStorage.getItem("adminInfo")) || null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAdminInfo: (state, action) => {
      state.adminInfo = action.payload;
      localStorage.setItem("adminInfo", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.adminInfo = null;
      localStorage.removeItem("adminInfo");
    },
  },
});

export const { setAdminInfo, logout } = userSlice.actions;
export default userSlice.reducer;