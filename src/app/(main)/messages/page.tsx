"use client"

import { messages } from "@/data/messages";
import { LinePaper } from "./linepaper";
import { useRef } from "react";

export default function Messages() {
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <div
      className="message-list"
      onWheel={(event) => {
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
          left: event.deltaY * 2,
          behavior: 'smooth',
        });
      }}
      ref={scrollRef}
    >
      <div
        className="button-shadow prev"
        onClick={() => scrollRef?.current?.scrollBy({
          left: -(scrollRef?.current.children.item(1)?.clientWidth ?? 0) - 4.5*16,
          behavior: 'smooth'
        })}
      >
        <div className="message-nav-button">Prev</div>
      </div>
      {messages.map(message => <LinePaper key={message.id} message={message} />)}
      <div
        className="button-shadow next"
        onClick={() => scrollRef?.current?.scrollBy({
          left: (scrollRef?.current.children.item(1)?.clientWidth ?? 0) + 4.5*16,
          behavior: 'smooth'
        })}
      >
        <div className="message-nav-button">Next</div>
      </div>
    </div>
  );
}