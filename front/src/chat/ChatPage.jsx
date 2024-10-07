import React, { useState, useEffect, useRef } from 'react';
import api from '../auth/api';
import './ChatPage.css';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

function ChatPage() {
	const [sockets, setSockets] = useState({});
	const [message, setMessage] = useState('');
	const [chat, setChat] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [currentContact, setCurrentContact] = useState('');
	const [unreadMessages, setUnreadMessages] = useState({});
	const [roomId, setRoomId] = useState('');
	const [allUsers, setAllUsers] = useState([]);
	const [isTyping, setIsTyping] = useState(false);
	const [receivedMessage, setReceivedMessage] = useState({});
	const [notificationSocket, setNotificationSocket] = useState(null);
	const [data, setData] = useState({
		chat_rooms: [],
		user: {},
		session: {},
		cookie: {},
	});
	const chatMessagesRef = useRef(null);
	const hasFetchedData = useRef(false);

	useEffect(() => {
		if (chatMessagesRef.current) {
			chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
		}
	}, [chat]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get('/chat');
				setData(response.data);
				setupSocket(1);
				setupNotificationSocket();
				initUnreadMessages(response.data);
			} catch (error) {
				console.error('Error fetching chat data:', error);
				if (error.response && error.response.status === 401) {
					window.location.href = '/api/login';
				}
			}
		};
		
		if (!hasFetchedData.current) {
			fetchData();
			hasFetchedData.current = true;
		}

		return () => {
			if (notificationSocket) {
				notificationSocket.close()
			}
		};
	}, []);

	const initUnreadMessages = (data) => {
		const urmsg = {};
		data.chat_rooms.forEach(room => {
			const otherUserId = room.user1.id === data.user.id ? room.user2.id : room.user1.id;
			let unreadCount = 0;
			for (let i = room.messages.length - 1; i >= 0; i--) {
				const message = room.messages[i];
				if (message.sender.id === data.user.id) {
					break;
				}
				if (!message.is_read && message.receiver.id === data.user.id) {
					unreadCount++;
				}
			}
			urmsg[otherUserId] = unreadCount;
		});
		setUnreadMessages(urmsg);
	};

	const setupNotificationSocket = () => {
		const token = localStorage.getItem('access_token');
		const socket = new WebSocket(`ws://localhost:8000/ws/notification/?token=${token}`);
	
		socket.onopen = () => {
			console.log('Connected to notification socket');
		};
	
		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'NEW_ROOM') {
				console.log('New room created:', data.room_data);
				setData(prevData => ({
					...prevData,
					chat_rooms: [...prevData.chat_rooms, data.room_data]
				}));
			}
		};
	
		socket.onerror = (error) => {
			console.error('Notification socket error:', error);
		};
	
		socket.onclose = (event) => {
			console.log('Notification socket closed:', event);
		};
	
		setNotificationSocket(socket);
	};

	useEffect(() => {
		if (currentContact) {
			const contactId = currentContact.user1.id === data.user.id ? currentContact.user2.id : currentContact.user1.id
			setUnreadMessages({
				...unreadMessages,
				[contactId]: 0
			})
			if (sockets[currentContact.id] && sockets[currentContact.id].readyState === WebSocket.OPEN) {
				sockets[currentContact.id].send(JSON.stringify({
					type: 'MARK_AS_READ',
					room_id: currentContact.id,
					user: data.user.id,
				}))
			}
		}
	}, [currentContact]);

	useEffect(() => {
		Object.entries(unreadMessages).forEach(([userId, count]) => {
			const user = data.chat_rooms.flatMap(room => [room.user1, room.user2])
				.find(user => user.id === parseInt(userId));
			if (user && count > 0) {
				console.log(`${count} unread messages from ${user.username}`);
			}
		});
	}, [unreadMessages]);

	useEffect(() => {
		if (!receivedMessage) {
			return
		}
		if (receivedMessage.chat_room === roomId) {
			setChat(prevChat => ([
				...prevChat,
				receivedMessage
			]));
		} else if (receivedMessage && receivedMessage.sender) {
			setUnreadMessages({
				...unreadMessages,
				[receivedMessage.sender.id]: (unreadMessages[receivedMessage.sender.id] || 0) + 1
			})
		}
	}, [receivedMessage]);

	const updateChatRooms = (prevData, newMessage) => {
		const updatedChatRooms = prevData.chat_rooms.map(room => {
		  if (room.id === newMessage.chat_room) {
			return {
			  ...room,
			  messages: [...room.messages, newMessage],
			  modified_at: new Date().toISOString()
			};
		  }
		  return room;
		});
	  
		if (!updatedChatRooms.some(room => room.id === newMessage.chat_room)) {
		  updatedChatRooms.push({
			id: newMessage.chat_room,
			user1: newMessage.sender,
			user2: newMessage.receiver,
			messages: [newMessage],
			created_at: new Date().toISOString(),
			modified_at: new Date().toISOString()
		  });
		}
	  
		return {
		  ...prevData,
		  chat_rooms: updatedChatRooms
		};
	};

	const handleUnreadMessages = (message) => {
		if (data.user.id === message.sender.id) {
			return
		}
		if (currentContact) {
			const currentContactId = currentContact.user1.id === data.user.id ? currentContact.user2.id : currentContact.user1.id
			if (currentContactId === message.sender.id) {
				return
			}
		}
		setUnreadMessages({
			...unreadMessages,
			[message.sender.id]: (unreadMessages[message.sender.id] || 0) + 1
		})
	}

	const setupSocket = (room_id) => {
		return new Promise((resolve, reject) => {
			if (!room_id) {
				return reject(new Error('No room ID provided'));
			}
			if (sockets[room_id]) {
				resolve(sockets[room_id]);
				return;
			}
		
			const token = localStorage.getItem('access_token');	
			const newSocket = new WebSocket(`ws://localhost:8000/ws/chat/${room_id}/?token=${token}`)

			newSocket.onopen = () => {
				setSockets(prev => ({
					...prev,
					[room_id]: newSocket
				}));
				resolve(newSocket);
			}

			newSocket.onerror = (error) => {
				console.error('WebSocket error:', error);
				reject(error);
			}

			newSocket.onmessage = (event) => {
				const data = JSON.parse(event.data)
				switch (data.type) {
					case 'USERS_LIST':
						console.log('Received users list:', data)
						setAllUsers(data.users);
						break
					case 'MESSAGE':
						if (!data.message || !data.message.sender) {
							console.log('Received empty message, ignoring');
							break;
						}
						console.log('Received message:', data)
						setData(prevData => updateChatRooms(prevData, data.message))

						setReceivedMessage(data.message)
						// handleUnreadMessages(data.message)
						break
					case 'TYPING':
						setTypingUsers(prevTyping => [...prevTyping, data.user])
						break
					case 'USER_SELECTED':
						console.log('User selected:', data.status)
						if (data.status === 'OK') {
							setupChatRoom(data.chat_room)
							setupSocket(data.chat_room.id)
							resolve(newSocket)
						}
						break
					default:
						console.log('Unknown message type:', data.type)
						break
				}
			}

			newSocket.onclose = (event) => {
				console.log(`Disconnected from server for room ${room_id}. Code: ${event.code}, Reason: ${event.reason}`);
				setSockets(prev => {
					const { [room_id]: _, ...newSockets } = prev;
					return newSockets;
				})
			}

			setSockets(prev => ({
				...prev,
				[room_id]: newSocket
			}))

			return () => newSocket.close()
		})
	}

	const sendMessage = (e) => {
		e.preventDefault()
		if (message) {
			sockets[roomId].send(JSON.stringify({
				type: 'MESSAGE',
				room_id: roomId,
				sender: data.user.id,
				content: message,
			}))
			setMessage('')
		}
	}

	const handleTyping = (e) => {
		setMessage(e.target.value)
		if (sockets[roomId] && sockets[roomId].readyState === WebSocket.OPEN) {
			sockets[roomId].send(JSON.stringify({
				type: 'TYPING',
				room_id: roomId,
				user: data.user.id,
			}))
		}
	}

	const setupChatRoom = (contact) => {
		setCurrentContact(contact)
		setRoomId(contact.id)
		setChat(contact.messages)
	}

	return (
        <div className="chat-app">
            <h1 className="chat-header">Chat</h1>
            <div className="chat-layout">
                <Sidebar
                    setupChatRoom={setupChatRoom}
                    setupSocket={setupSocket}
                    data={data}
					allUsers={allUsers}
					unreadMessages={unreadMessages}
                />
                <ChatWindow
                    currentContact={currentContact}
                    chat={chat}
                    message={message}
                    sendMessage={sendMessage}
                    handleTyping={handleTyping}
                    currentUser={data.user}
					chatMessagesRef={chatMessagesRef}
                />
            </div>
        </div>
    );
}

export default ChatPage;
