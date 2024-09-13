import { useState } from 'react'

// chat application

function App() {

	return (
		<>
			<div id="chat-app">
				<div id="chat-container">
						<div>
								<div id="current-contact">
										<span id="contact-name">Contact Name</span>
								</div>
						</div>
						<div id="chat-messages">
						</div>
						<form id="chat-form">
								<input type="text" id="chat-message" placeholder="Type a message" />
								<button type="submit">Send</button>
						</form>
				</div>
				<div id="sidebar">
						<div id="search-container">
								<input type="text" id="search" placeholder="Search contacts" />
						</div>
						<div id="contact-list">
								<div class="contact">
									<div class="contact-image"></div>
									<div class="contact-info">
										<span class="contact-name">hsobane</span>
										<span class="contact-status">Online</span>
										<span class="contact-unread">0</span>
									</div>
								</div>
						</div>
				</div>
		</div>
		</>
	)
}

export default App
