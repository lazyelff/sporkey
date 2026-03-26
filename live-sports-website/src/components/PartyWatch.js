import React, { useState, useEffect, useRef } from 'react';
import useVoiceChat from '../hooks/useVoiceChat';
import '../styles/PartyWatch.css';

const AudioPlayer = ({ stream }) => {
    const audioRef = useRef();

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay />;
};

const PartyWatch = ({ roomId, user, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [participants, setParticipants] = useState([]);
    const chatRef = useRef(null);

    const { inVoice, isMuted, remoteStreams, joinVoice, leaveVoice, toggleMute } = useVoiceChat(roomId, user);

    // Initialize and poll room data
    useEffect(() => {
        if (!roomId || !user) return;

        const pollRoom = () => {
            // Update messages
            const chatKey = `room_${roomId}_chat`;
            const savedChat = JSON.parse(localStorage.getItem(chatKey)) || [];
            
            // Only update state if new messages arrived to avoid unnecessary re-renders
            setMessages(prev => {
                if (prev.length !== savedChat.length) return savedChat;
                return prev;
            });

            // Update participants
            const usersKey = `room_${roomId}_users`;
            let usersObj = JSON.parse(localStorage.getItem(usersKey)) || {};
            
            // Register self
            usersObj[user.id] = {
                username: user.username,
                avatar: localStorage.getItem(`userAvatar_${user.id}`) || '👤',
                lastSeen: Date.now()
            };
            
            // Cleanup stale users (inactive for > 15 seconds)
            const now = Date.now();
            Object.keys(usersObj).forEach(userId => {
                if (now - usersObj[userId].lastSeen > 15000) {
                    delete usersObj[userId];
                }
            });
            
            localStorage.setItem(usersKey, JSON.stringify(usersObj));
            setParticipants(Object.values(usersObj));
        };

        pollRoom();
        const interval = setInterval(pollRoom, 1000); // Poll every second for new messages/users

        return () => {
            clearInterval(interval);
            // Optionally remove self on unmount, but polling handles timeout anyway
        };
    }, [roomId, user]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const chatKey = `room_${roomId}_chat`;
        const currentChat = JSON.parse(localStorage.getItem(chatKey)) || [];
        
        const newMessage = {
            id: Date.now(),
            senderId: user.id,
            senderName: user.username,
            text: input.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const updatedChat = [...currentChat, newMessage];
        localStorage.setItem(chatKey, JSON.stringify(updatedChat));
        setMessages(updatedChat);
        setInput('');
    };

    if (!roomId) return null;

    return (
        <div className="party-watch-container">
            <div className="party-header">
                <div className="party-info">
                    <h3>🎉 Watch Party</h3>
                    <div className="party-id">Room: {roomId}</div>
                </div>
                <button className="close-party-btn" onClick={onClose}>&times;</button>
            </div>
            
            <div className="party-users">
                <h4>👥 In Room ({participants.length})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {participants.map((p, idx) => (
                        <span key={idx} className={`user-chip ${p.inVoice ? 'in-voice' : ''}`}>
                            {p.avatar} {p.username}
                            {p.inVoice && <span className="mic-icon" style={{marginLeft: '4px', fontSize: '0.9rem'}}>{p.isMuted ? '🔇' : '🎤'}</span>}
                        </span>
                    ))}
                </div>
            </div>

            {/* Hidden Audio Players for voice chat */}
            {Object.keys(remoteStreams).map(peerId => (
                <AudioPlayer key={peerId} stream={remoteStreams[peerId]} />
            ))}

            <div className="party-chat" ref={chatRef}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8892b0', marginTop: '2rem' }}>
                        No messages yet. Say hi! 👋
                    </div>
                ) : (
                    messages.map(msg => {
                        const isSelf = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={`chat-message ${isSelf ? 'self' : 'other'}`}>
                                {!isSelf && <span className="chat-sender">{msg.senderName}</span>}
                                <div className="chat-bubble">{msg.text}</div>
                            </div>
                        );
                    })
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input 
                    type="text" 
                    className="chat-input" 
                    placeholder="Type a message..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
                    ➤
                </button>
            </form>

            <div className="voice-control-area">
                {!inVoice ? (
                    <button className="btn-voice join-voice" onClick={joinVoice}>
                        📞 Join Voice
                    </button>
                ) : (
                    <>
                        <button className={`btn-voice ${isMuted ? 'muted' : 'active'}`} onClick={toggleMute}>
                            {isMuted ? '🔇 Muted' : '🎤 Unmute'}
                        </button>
                        <button className="btn-voice leave-voice" onClick={leaveVoice}>
                            ❌ Disconnect
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PartyWatch;
