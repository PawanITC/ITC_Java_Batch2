import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

function NotificationDetails() {
  const [activeTab, setActiveTab] = useState("all");
  const {isAuthenticated, setIsAuthenticated, user, setUser, loading}= useContext(AuthContext);
  
  return (
    <NotificationPanel userId={user?.userId} />
  );
}

export default NotificationDetails;
