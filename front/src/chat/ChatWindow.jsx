import React, { useState } from 'react';
import MessageItem from './MessageItem';
import ChatOptionsMenu from './ChatOptionsMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
    
function ChatWindow({ currentContact, chat, message, sendMessage, handleTyping, currentUser, chatMessagesRef }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleBlockUser = () => {
        console.log('Block User');
    };

    const handlePlayPong = () => {
        console.log('Play Pong');
    };

    const handlePlayTicTacToe = () => {
        console.log('Play Tic-Tac-Toe');
    };
    return (
        <div className="chat-container">
            {currentContact ? (
                <>
                    <div className="chat-header">
                        <div className="current-contact">
                            {currentContact.avatar ? (
                                <img src={currentContact.avatar} alt={currentContact.username} className="contact-avatar" />
                            ) : (
                                <div className="contact-avatar default-avatar">
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                            )}
                            <span className="contact-name">
                                {currentContact.user1.id === currentUser.id ? currentContact.user2.username : currentContact.user1.username}
                            </span>
                        </div>
                        <ChatOptionsMenu
                            onBlockUser={handleBlockUser}
                            onPlayPong={handlePlayPong}
                            onPlayTicTacToe={handlePlayTicTacToe}
                        />
                    </div>
                    <div className="chat-messages" ref={chatMessagesRef}>
                        {chat.map((msg, index) => (
                            <MessageItem key={index} message={msg} currentUser={currentUser} />
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
    );
}

export default ChatWindow;