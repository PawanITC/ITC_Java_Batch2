import { createContext,useState,useEffect, use } from "react";

export const ThemeContext=createContext();
export default function ThemeProvider({children}){
    const [theme,setTheme]=useState("light");

    useEffect(()=>{
        const savedTheme=localStorage.getItem("theme");
        if(savedTheme){
            setTheme(savedTheme);
        }
        else{
            const prefersDark=window.matchMedia&&(window.matchMedia("(prefers-color-scheme:dark)").matches);
            setTheme(prefersDark?"dark":"light");
        }
    },[]);

    useEffect(()=>{
        if(theme==="dark"){
            document.documentElement.classList.add("dark");
        }
        else{
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme",theme);
    },[theme]);


    const toggleTheme=()=>{
        const newTheme=theme==="light"?"dark":"light";
        setTheme(newTheme);
        localStorage.setItem("theme",newTheme);
    };

    return(
        <ThemeContext.Provider value={{theme,toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}