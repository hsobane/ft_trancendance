import React, { useState, useEffect, useRef } from 'react';
import { logout } from '../auth/authService';
import api from '../auth/api';
import './ChatPage.css';

function ChatPage() {
	const [sockets, setSockets] = useState({});
	const [message, setMessage] = useState('');
	const [chat, setChat] = useState([]);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [typingUsers, setTypingUsers] = useState([]);
	const [search, setSearch] = useState('');
	const [contacts, setContacts] = useState([]);
	const [currentContact, setCurrentContact] = useState('');
	const [unreadMessages, setUnreadMessages] = useState({});
	const [unreadTotal, setUnreadTotal] = useState(0);
	const [roomId, setRoomId] = useState('');
	const [allUsers, setAllUsers] = useState([]);
	const [matchedUsers, setMatchedUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [activeUsers, setActiveUsers] = useState({});
	const [sortedRooms, setSortedRooms] = useState([]);
	const [data, setData] = useState({
		chat_rooms: [],
		user: {},
		session: {},
		cookie: {},
	});

	const hasFetchedData = useRef(false)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get('/chat');
				setData(response.data);
				console.log('data :', response.data);
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
	}, []);

	useEffect(() => {
		console.log('allUsers updated:', allUsers);
		setMatchedUsers(allUsers.filter(user => 
			user.username.toLowerCase().startsWith(search.toLowerCase())
		).slice(0, 5));
	}, [allUsers]);

	useEffect(() => {
		if (search.length < 2) {
			setMatchedUsers([]);
			return;
		}

		const performSearch = async () => {
			try {
				const socket = await setupSocket(1);
				socket.send(JSON.stringify({
					type: 'SEARCH_USERS',
					query: search,
				}));
			} catch (error) {
				console.error('Error fetching matched users:', error);
			}
		}

		if (search.length === 2) {
			performSearch();
		} else {
			const filteredUsers = allUsers.filter(user => 
				user.username.toLowerCase().startsWith(search.toLowerCase())
			);
			setMatchedUsers(filteredUsers.slice(0, 5));
		}
	}, [search]);

	// useEffect(() => {
	// 	console.log('matchedUsers :', matchedUsers);
	// }, [matchedUsers]);

	useEffect(() => {
		const sortedRooms = data.chat_rooms.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));
		setSortedRooms(sortedRooms);
		console.log('sortedRooms :', sortedRooms);
	}, [data.chat_rooms]);

	// useEffect(() => {
	// 	console.log('chat :', chat);
	// }, [chat]);

	// useEffect(() => {
	// 	console.log('roomId :', roomId);
	// }, [roomId]);

	useEffect(() => {
		console.log('currentContact :', currentContact);
	}, [currentContact]);

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

	const setupSocket = (room_id) => {
		return new Promise((resolve, reject) => {
			if (!room_id) {
				return reject(new Error('No room ID provided'));
			}
			if (sockets[room_id]) {
				resolve(sockets[room_id]);
				return;
			}
		
			console.log('setting up socket for room', room_id);
			const newSocket = new WebSocket(`ws://localhost:8000/ws/chat/${room_id}/`)

			newSocket.onopen = () => {
				console.log('Connected to server for room', room_id)
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
						setAllUsers(data.users);
						break
					case 'MESSAGE':
						console.log('Received message:', data)
						setData(prevData => updateChatRooms(prevData, data.message))

						if (data.message.chat_room === room_id) {
							setChat(prevChat => ([
								...prevChat,
								data.message
							]));
						}
						if (data.sender !== currentContact) {
							setUnreadMessages({
								...unreadMessages,
								[data.sender]: (unreadMessages[data.sender] || 0) + 1
							})
							setUnreadTotal(unreadTotal + 1)
						}
						break
					case 'TYPING':
						setTypingUsers(prevTyping => [...prevTyping, data.user])
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

	const handleSearch = async (e) => {
		const searchValue = e.target.value;
		setSearch(searchValue);
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
			// setChat(prevChat => ([
			// 	...prevChat,
			// 	{
			// 		sender: data.user.id,
			// 		content: message,
			// 		created_at: new Date().toISOString(),
			// 	}
			// ]));
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

	return (
		<>
			<div className="chat-app">
    <h1 className="chat-header">Chat</h1>
    <div className="chat-layout">
        <div className="sidebar">
            <div className="search-container">
                <input type="text" className="search" placeholder="Search contacts" onChange={handleSearch} />
            </div>
            <div className="contact-list">
                {sortedRooms.map((contact, index) => (
                    <div key={index} className="contact" onClick={() => {
                        setCurrentContact(contact);
                        setChat(contact.messages);
                        setRoomId(contact.id);
                        setupSocket(contact.id);
                    }}>
                        <div className="contact-info">
							<div className="contact-avatar-container">
								{contact.user1.id == data.user.id ? contact.user2.avatar : contact.user1.avatar}
							</div>
                            <span className="contact-name">
								{contact.user1.id == data.user.id ? contact.user2.username : contact.user1.username}
							</span>
                            <span className="contact-status">Online</span>
                            <span className="contact-unread">0</span>
                            <span className="contact-last-message">{contact.modified_at}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="chat-container">
            {currentContact ? (
                <>
                    <div className="current-contact">
                        {currentContact.avatar && (
                            <img src={currentContact.avatar} alt={currentContact.username} className="contact-avatar" />
                        )}
                        <span className="contact-name">
							{currentContact.user1.id == data.user.id ? currentContact.user2.username : currentContact.user1.username}
						</span>
                    </div>
                    <div className="chat-messages">
						{chat.map((msg, index) => (
							<div key={index} className={`message ${msg.sender.username === data.user.username ? 'sent' : 'received'}`}>
								{/* <span className="message-sender">{msg.sender.username}</span> */}
								<div className="message-content">
									<span className="message-text">{msg.content}</span>
									<span className="message-time">
										{new Date(msg.created_at).toLocaleTimeString('en-US', {
											hour: 'numeric',
											minute: '2-digit',
											hour12: true
										})}
									</span>
								</div>
							</div>
						))}
					</div>
                    <form className="chat-form" onSubmit={sendMessage}>
                        <input
                            type="text"
                            className="chat-message"
                            value={message}
                            onChange={handleTyping}
                            placeholder="Type a message"
                        />
                        <button type="submit">Send</button>
                    </form>
                </>
            ) : (
                <div className="no-contact-selected">
                    <p>Select a contact to start chatting</p>
                </div>
            )}
        </div>
    </div>
</div>
		</>
	)
}

export default ChatPage;
