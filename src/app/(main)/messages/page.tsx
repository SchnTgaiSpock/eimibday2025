"use client"

import { messages } from "@/data/messages";
import { LinePaper } from "./linepaper";

export default function Messages() {
  return (<div className="message-list" onWheel={(event) => {
    event.preventDefault();
    event.currentTarget.scrollBy({
      left: event.deltaY*2,
      behavior: 'smooth'
    });
  }}>
    {messages.map(message => <LinePaper key={message.author} message={message} />)}
  </div>
  );
}