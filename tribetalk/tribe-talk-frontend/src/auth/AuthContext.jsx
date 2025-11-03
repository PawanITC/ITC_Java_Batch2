import { createContext,useState,useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";

export const AuthContext=createContext();

export function AuthProvider({children}){
    const [user,setUser]=useState(null);

    const checkAuth = async () => {
        try{
            const response=await axiosInstance.get('/auth/me');
            console.log(response);
            setUser(response.data);
        }
        catch{
            setUser(null);
        }
    }

    useEffect(()=>{
        checkAuth();
    },[]);

    return (
        <AuthContext.Provider value={{user,setUser,checkAuth}}>
            {children}
        </AuthContext.Provider>
    )
}