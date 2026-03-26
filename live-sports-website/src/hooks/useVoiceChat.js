import { useState, useEffect, useRef, useCallback } from 'react';

const useVoiceChat = (roomId, user) => {
    const [inVoice, setInVoice] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState({});
    const processedSignalsRef = useRef(new Set());
    
    const localStreamRef = useRef(null);
    const peersRef = useRef({}); // { targetId: RTCPeerConnection }
    
    const signalsKey = `room_${roomId}_signals`;

    const sendSignal = useCallback((targetId, type, data) => {
        const signals = JSON.parse(localStorage.getItem(signalsKey)) || [];
        const newSignal = {
            id: Date.now() + Math.random().toString(),
            from: user.id,
            to: targetId,
            type,
            data
        };
        // Keep only last 50 signals to avoid massive localStorage
        if (signals.length > 50) signals.splice(0, signals.length - 50);
        signals.push(newSignal);
        localStorage.setItem(signalsKey, JSON.stringify(signals));
    }, [roomId, user?.id, signalsKey]);

    const markVoiceState = useCallback((isActive) => {
        const usersKey = `room_${roomId}_users`;
        let usersObj = JSON.parse(localStorage.getItem(usersKey)) || {};
        if (usersObj[user.id]) {
            usersObj[user.id].inVoice = isActive;
            localStorage.setItem(usersKey, JSON.stringify(usersObj));
            window.dispatchEvent(new Event('storage'));
        }
    }, [roomId, user?.id]);

    const createPeer = useCallback((targetId, initiator) => {
        if (peersRef.current[targetId]) return peersRef.current[targetId];

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current);
            });
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal(targetId, 'ice-candidate', event.candidate);
            }
        };

        peer.ontrack = (event) => {
            setRemoteStreams(prev => ({
                ...prev,
                [targetId]: event.streams[0]
            }));
        };

        peer.onconnectionstatechange = () => {
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
                setRemoteStreams(prev => {
                    const newStreams = {...prev};
                    delete newStreams[targetId];
                    return newStreams;
                });
                peer.close();
                delete peersRef.current[targetId];
            }
        };

        if (initiator) {
            peer.createOffer().then(offer => {
                return peer.setLocalDescription(offer);
            }).then(() => {
                sendSignal(targetId, 'offer', peer.localDescription);
            }).catch(e => console.error("Error creating offer", e));
        }

        peersRef.current[targetId] = peer;
        return peer;
    }, [sendSignal]);

    useEffect(() => {
        if (!inVoice || !user) return;

        const handleStorage = async (e) => {
            if (e.key === signalsKey && e.newValue) {
                const signals = JSON.parse(e.newValue);
                const recentSignals = signals.slice(-10); // Check last 10
                
                for (const signal of recentSignals) {
                    if (processedSignalsRef.current.has(signal.id)) continue;
                    processedSignalsRef.current.add(signal.id);
                    // Cleanup set to prevent memory leak
                    if (processedSignalsRef.current.size > 200) {
                        const arr = Array.from(processedSignalsRef.current).slice(-100);
                        processedSignalsRef.current = new Set(arr);
                    }

                    if (signal.to !== user.id && signal.to !== 'all') continue;
                    if (signal.from === user.id) continue;
                    
                    if (signal.type === 'peer-joined') {
                        createPeer(signal.from, true);
                    }
                    else if (signal.type === 'offer') {
                        const peer = createPeer(signal.from, false);
                        if (peer.signalingState !== 'stable') continue;
                        await peer.setRemoteDescription(new RTCSessionDescription(signal.data));
                        const answer = await peer.createAnswer();
                        await peer.setLocalDescription(answer);
                        sendSignal(signal.from, 'answer', peer.localDescription);
                    }
                    else if (signal.type === 'answer') {
                        const peer = peersRef.current[signal.from];
                        if (peer && peer.signalingState === 'have-local-offer') {
                            await peer.setRemoteDescription(new RTCSessionDescription(signal.data));
                        }
                    }
                    else if (signal.type === 'ice-candidate') {
                        const peer = peersRef.current[signal.from];
                        if (peer && peer.remoteDescription) {
                            try {
                                await peer.addIceCandidate(new RTCIceCandidate(signal.data));
                            } catch (e) {
                                console.error("Error adding ice candidate", e);
                            }
                        }
                    }
                    else if (signal.type === 'peer-left') {
                        if (peersRef.current[signal.from]) {
                            peersRef.current[signal.from].close();
                            delete peersRef.current[signal.from];
                            setRemoteStreams(prev => {
                                const nw = {...prev};
                                delete nw[signal.from];
                                return nw;
                            });
                        }
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [inVoice, user, createPeer, signalsKey]);

    const joinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setInVoice(true);
            setIsMuted(false);
            sendSignal('all', 'peer-joined', null);
            markVoiceState(true);
        } catch (err) {
            console.error("Failed to join voice", err);
            alert("Microphone access denied. Voice chat requires mic permissions.");
        }
    };

    const leaveVoice = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        Object.values(peersRef.current).forEach(peer => peer.close());
        peersRef.current = {};
        sendSignal('all', 'peer-left', null);
        setInVoice(false);
        setRemoteStreams({});
        markVoiceState(false);
    }, [sendSignal, markVoiceState]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (inVoice) leaveVoice();
        };
    }, [inVoice, leaveVoice]);

    return {
        inVoice,
        isMuted,
        remoteStreams,
        joinVoice,
        leaveVoice,
        toggleMute
    };
};

export default useVoiceChat;
