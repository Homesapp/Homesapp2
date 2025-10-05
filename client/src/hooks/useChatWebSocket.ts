import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";

interface WebSocketMessage {
  type: 'new_message';
  conversationId: string;
  message: any;
}

export function useChatWebSocket(conversationId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!conversationId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: 'join_conversation',
          conversationId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === 'new_message' && data.conversationId === conversationId) {
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/conversations", conversationId, "messages"] 
            });
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/conversations"] 
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [conversationId, connect]);

  return null;
}
