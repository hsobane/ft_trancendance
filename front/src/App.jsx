import { useState } from 'react'
import { useEffect } from 'react'
import LoginPage from './login/LoginPage'

// chat application

function App() {
	return (
		<div>
			<LoginPage />
		</div>
	)
	// const [socket, setSocket] = useState(null)
	// const [username, setUsername] = useState('')
	// const [message, setMessage] = useState('')
	// const [chat, setChat] = useState([])
	// const [onlineUsers, setOnlineUsers] = useState([])
	// const [typingUsers, setTypingUsers] = useState([])
	// const [search, setSearch] = useState('')
	// const [contacts, setContacts] = useState([])
	// const [currentContact, setCurrentContact] = useState('')
	// const [unreadMessages, setUnreadMessages] = useState({})
	// const [unreadTotal, setUnreadTotal] = useState(0)
	// const [roomId, setRoomId] = useState('')
	// const [data, setData] = useState({
	// 	rooms: [],
	// 	messages: [],
	// 	title: '',
	// 	user: {},
	// 	session: {},
	// 	cookie: {},
	// });

	// useEffect(() => {
	// 	fetch('http://localhost:8000/chat')
	// 		.then((response) => {
	// 			if (response.redirected) {
	// 				window.location.href = response.url;
	// 				return;
	// 			}
	// 			return response.json();
	// 		})
	// 		.then((data) => setData(data))
	// 		.then((data) => {
	// 			console.log('Data: ', data)
	// 		})
	// 		.catch((error) => console.error('Error fetching data: ', error));
	// }, []);

	

	// const setupSocket = () => {
	// 	// const token = localStorage.getItem('token')
	// 	const newSocket = new WebSocket(`ws://localhost:8080/ws/chat/`)

	// 	newSocket.onopen = () => {
	// 		console.log('Connected to server')
	// 	}

	// 	newSocket.onmessage = (event) => {
	// 		const data = JSON.parse(event.data)
	// 		switch (data.type) {
	// 			case 'USERS_LIST':
	// 				setActiveUsers(data.users)
	// 				break
	// 			case 'MESSAGE':
	// 				setChat([...chat, data])
	// 				if (data.sender !== currentContact) {
	// 					setUnreadMessages({
	// 						...unreadMessages,
	// 						[data.sender]: (unreadMessages[data.sender] || 0) + 1
	// 					})
	// 					setUnreadTotal(unreadTotal + 1)
	// 				}
	// 				break
	// 			case 'TYPING':
	// 				setTypingUsers(data.users)
	// 				break
	// 			default:
	// 				break
	// 		}
	// 	}

	// 	newSocket.onclose = () => {
	// 		console.log('Disconnected from server')
	// 		setSocket(null)
	// 		setupSocket()
	// 	}

	// 	setSocket(newSocket)

	// 	return () => newSocket.close()
	// }

	// const sendMessage = (e) => {
	// 	e.preventDefault()
	// 	if (message) {
	// 		socket.send(
	// 			JSON.stringify({
	// 				type: 'MESSAGE',
	// 				room_id: roomId,
	// 				sender: username,
	// 				message,
	// 			})
	// 		)
	// 		setChat([...chat, { sender: username, message }])
	// 		setMessage('')
	// 	}
	// }

	// const setActiveUsers = (users) => {
	// 	setOnlineUsers(users)
		
	// }

	// const handleSearch = (e) => {
	// 	setSearch(e.target.value)
	// }

	// const handleContactClick = (contact) => {
	// 	setCurrentContact(contact)
	// 	setUnreadMessages({
	// 		...unreadMessages,
	// 		[contact]: 0
	// 	})
	// 	setUnreadTotal(unreadTotal - (unreadMessages[contact] || 0))
	// }

	// return (
	// 	<>
	// 		<div id="chat-app">
	// 			<div id="chat-container">
	// 					<div id="current-contact">
	// 							<span id="contact-name">Contact Name</span>
	// 					</div>
	// 					<div id="chat-messages">
	// 					</div>
	// 					<form id="chat-form">
	// 							<input type="text" id="chat-message" placeholder="Type a message" />
	// 							<button type="submit">Send</button>
	// 					</form>
	// 			</div>
	// 			<div id="sidebar">
	// 					<div id="search-container">
	// 							<input type="text" id="search" placeholder="Search contacts" />
	// 					</div>
	// 					<div id="contact-list">
	// 							<div className="contact">
	// 								<div className="contact-image"></div>
	// 								<div className="contact-info">
	// 									<span className="contact-name">hsobane</span>
	// 									<span className="contact-status">Online</span>
	// 									<span className="contact-unread">0</span>
	// 								</div>
	// 							</div>
	// 					</div>
	// 			</div>
	// 		</div>
	// 	</>
	// )
}

export default App
