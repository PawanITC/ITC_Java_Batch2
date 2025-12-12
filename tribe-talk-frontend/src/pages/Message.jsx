import Sidebar from "../components/Sidebar";
import MainHeader from "../components/MainHeader";
import MessageDetails from "../components/MessageDetails";
import MessagePreivewPlaceHolder from "../components/MessagePreivewPlaceHolder";
import ChatScreen from "../components/ChatScreen";
import { useEffect, useState } from "react";
import axiosInstance from "../services/axiosInstance";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function Message() {
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        axiosInstance.get(`/users/loggedUser`).then((res) => {
            setCurrentUser(res.data);
        });

        const socket = new SockJS("http://localhost:8081/ws");
        const client = new Client({ webSocketFactory: () => socket });
        client.activate();
        setStompClient(client);
    }, []);


    return (
        <div className="flex bg-neutral-900 text-yellow-200 min-h-screen">
            <Sidebar />

            {/* Main content area */}
            <div className="flex flex-col md:flex-row grow md:ml-64 ml-20 w-full">

                {/* LEFT SIDE */}
                <main className="w-full md:w-2/3 max-w-2xl">
                    <MainHeader />
                    <div className="px-4 py-6 space-y-4">
                        <MessageDetails
                          currentUser={currentUser}
                          setSelectedUser={setSelectedUser}
                        />

                    </div>
                </main>

                {/* RIGHT SIDE */}
        <div className="flex justify-center items-center w-full border-l border-neutral-800">                  {selectedUser ? (
                    currentUser ? (
                      <ChatScreen
                        user={selectedUser}
                        currentUser={currentUser}
                        stompClient={stompClient}
                      />
                    ) : (
                      <div className="text-yellow-400 p-4">Loading user...</div>
                    )
                  ) : (
                    <MessagePreivewPlaceHolder onSelectUser={setSelectedUser} />
                  )}
                </div>
            </div>
        </div>
    );
}

export default Message;
