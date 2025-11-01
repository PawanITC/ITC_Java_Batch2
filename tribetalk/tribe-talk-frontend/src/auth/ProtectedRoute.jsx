import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({children}){
    const {user}=useContext(AuthContext);
    if(!user) return <Navigate to="/"></Navigate>;
    return children;
}