import React, { useEffect } from 'react';

function ContactItem({ contact, currentUser, onClick, unreadMessages }) {
    const otherUser = contact.user1.id === currentUser.id ? contact.user2 : contact.user1;
    const unreadCount = unreadMessages[otherUser.id] || 0;

    return (
        <div className="contact" onClick={onClick}>
            <div className="contact-info">
                <div className="contact-avatar-container">
                    {otherUser.avatar}
                </div>
                <div className="contact-details">
                    <span className="contact-name">{otherUser.username}</span>
                    <div className="contact-metadata">
                        <span className="contact-last-message">
                            {new Date(contact.modified_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                        {unreadCount > 0 && (
                            <span className="contact-unread">{unreadCount}</span>
                        )}
                        <span className="contact-status"></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactItem;