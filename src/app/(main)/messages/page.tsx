"use client"

import { messages } from "@/data/messages";
import { LinePaper } from "./linepaper";

export default function Messages() {
  return (<div className="message-list" onWheel={(event) => {
    if (event.shiftKey) return
    event.preventDefault();
    console.log(event)
    if (event.target !== event.currentTarget) {
      const el = event.target as HTMLDivElement
      const paper = el.closest(".paper-wrapper") as HTMLDivElement
      if (event.deltaY > 0) {
        if (paper.scrollTop + paper.clientHeight < paper.scrollHeight) return
      } else {
        if (paper.scrollTop > 0) return
      }
    }
    event.currentTarget.scrollBy({
      left: event.deltaY*2,
      behavior: 'smooth',
    });
  }}>
    {messages.map(message => <LinePaper key={message.id} message={message} />)}
  </div>
  );
}