"use client"

import { messages } from "@/data/messages"

export default function Credits() {
  return <div style={{ textAlign: "center", margin: "auto" }}>
    <div
      className="paper-wrapper"
      onScroll={e => {
        e.stopPropagation()
      }}
    >
      <div
        className="paper"
      >
        <div className="paper-header">
          <div className="paper-background"></div>
          <p></p>
        </div>
        <div className="paper-lines">
          <div className="paper-background noise"></div>
          <div>
            <p>
              <strong>Project Management</strong>
            </p>
            <p>
              Terminal Prophet<br />
              MisterYura<br />
              Botch Guy
            </p>
            <p>
              <strong>Development</strong>
            </p>
            <p>
              Schn<br />
              Liquid Skelie
            </p>
            <p>
              <strong>Participants</strong>
            </p>
            <p>
              {messages.map((m, i) => <>
                {m.from}
                {i !== messages.length - 1 && <br />}
              </>)}
            </p>
            <p>(will be updated with scran participants once voting is complete)</p>
          </div>
        </div>
      </div>
    </div>
  </div>
}