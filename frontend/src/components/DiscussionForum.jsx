import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import './DiscussionForum.css';

export default function DiscussionForum({ eventId, eventName }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !eventId) return;

        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
            auth: { token },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-event', eventId);
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('message-history', (msgs) => {
            setMessages(msgs);
        });

        socket.on('new-message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('message-deleted', (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        });

        return () => {
            socket.emit('leave-event', eventId);
            socket.disconnect();
        };
    }, [eventId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !socketRef.current) return;
        socketRef.current.emit('send-message', { eventId, content: input.trim() });
        setInput('');
    };

    const deleteMessage = (msgId) => {
        socketRef.current?.emit('delete-message', { messageId: msgId });
    };

    const canDelete = (msg) => {
        if (!user) return false;
        return msg.userId?._id === user.id || user.role === 'organizer' || user.role === 'admin';
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="forum-container">
            <div className="forum-header">
                <h3>💬 Discussion {eventName ? `— ${eventName}` : ''}</h3>
                <span className={`forum-status ${connected ? 'online' : 'offline'}`}>
                    {connected ? '● Live' : '○ Connecting...'}
                </span>
            </div>

            <div className="forum-messages">
                {messages.length === 0 ? (
                    <div className="forum-empty">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.userId?._id === user?.id;
                        return (
                            <div key={msg._id} className={`forum-msg ${isOwn ? 'own' : ''}`}>
                                <div className="forum-msg-header">
                                    <span className="forum-msg-author">
                                        {msg.userId?.firstName} {msg.userId?.lastName}
                                        {msg.userId?.role === 'organizer' && <span className="forum-badge org">Organizer</span>}
                                        {msg.userId?.role === 'admin' && <span className="forum-badge admin">Admin</span>}
                                    </span>
                                    <span className="forum-msg-time">{formatTime(msg.createdAt)}</span>
                                </div>
                                <div className="forum-msg-content">{msg.content}</div>
                                {canDelete(msg) && (
                                    <button className="forum-msg-delete" onClick={() => deleteMessage(msg._id)} title="Delete">×</button>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="forum-input" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={1000}
                    disabled={!connected}
                />
                <button type="submit" disabled={!connected || !input.trim()}>Send</button>
            </form>
        </div>
    );
}
