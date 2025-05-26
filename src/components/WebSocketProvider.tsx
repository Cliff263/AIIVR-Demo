"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";

export default function WebSocketProvider() {
  useEffect(() => {
    const socket = io("http://localhost:3000");
    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  return null;
} 