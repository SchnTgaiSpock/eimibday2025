import { hash } from "@/util/hash"
import { Message } from "../../../data/messages"

interface LinePaperProps {
  message: Message
}

export function LinePaper({
  message
}: LinePaperProps) {
  return <div
    className="paper"
    style={{
      transform: `rotate(${hash(message.content, 30)/10 - 1}deg)`
    }}
  >
    <div className="paper-header">
      <div className="paper-background"></div>
      <p>From: {message.author}</p>
    </div>
    <div className="paper-lines">
      <div className="paper-background"></div>
      {message.content.split("\n").map(s => <p key={s}>{s.trim()}</p>)}
      {!!message.imageUrl && <div className="paper-image">
        <img
          src={message.imageUrl}
          style={{
            transform: `rotate(${hash(message.content, 130)/10 - 6}deg)`
          }}
        />
      </div>}
    </div>
  </div>
} 