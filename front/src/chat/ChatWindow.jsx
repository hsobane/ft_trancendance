import React from 'react';
import MessageItem from './MessageItem';

function ChatWindow({ currentContact, chat, message, sendMessage, handleTyping, currentUser, chatMessagesRef }) {
    return (
        <div className="chat-container">
            {currentContact ? (
                <>
                    <div className="current-contact">
                        {currentContact.avatar && (
                            <img src={currentContact.avatar} alt={currentContact.username} className="contact-avatar" />
                        )}
                        <span className="contact-name">
                            {currentContact.user1.id === currentUser.id ? currentContact.user2.username : currentContact.user1.username}
                        </span>
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