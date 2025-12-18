import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
export const useNotificationWebSocket = (userId, onNotification) => {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    // Use the baked-in environment variable for the API URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        if (!userId) return;

        const client = new Client({
            // SockJS needs the full http URL
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/notification/ws-notifications`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log("WebSocket connected");
                setIsConnected(true);

                client.subscribe(`/topic/notifications/${userId}`, (message) => {
                    const notification = JSON.parse(message.body);
                    onNotification(notification);
                });
            },

            onDisconnect: () => {
                console.log("WebSocket disconnected");
                setIsConnected(false);
            },

            onStompError: (frame) => {
                console.error("STOMP error:", frame.headers['message']);
                console.error("Details:", frame.body);
            }

        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        }
    }, [userId, onNotification]);
    return isConnected;

};