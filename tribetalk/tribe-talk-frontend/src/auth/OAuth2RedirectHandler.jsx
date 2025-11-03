import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2RedirectHandler(){
    const navigate=useNavigate();

    useEffect(()=>{
        const params=new URLSearchParams(window.location.search);
        navigate("/mainpage");
    },[navigate]);

    return <p>Redirecting</p>;
}