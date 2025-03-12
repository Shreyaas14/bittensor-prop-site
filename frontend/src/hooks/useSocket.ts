import { useEffect, useState } from 'react';
import io from "socket.io-client";

const SOCKET_SERVER_URL = 'http://localhost:5001'; 

export const useSocket = () => {
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
};
