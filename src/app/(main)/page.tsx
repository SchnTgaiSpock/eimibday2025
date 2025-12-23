import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { messages } from "@/data/messages";

function Announcements() {
  return <div className="announcements">
    <h2 style={{ margin: 0 }}>Announcements</h2>
    <Card>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit
      <div className="actions">
        <button style={{ marginLeft: 'auto' }}>Dismiss</button>
      </div>
    </Card>
    <Card>
      test2
      <div className="actions">
        <button style={{ marginLeft: 'auto' }}>Dismiss</button>
      </div>
    </Card>
  </div>
}

function Card({ children }: { children?: ReactNode }) {
  return <div className="card">
    {children}
  </div>
}

export default function Home() {
  return (<>
    <div className="scroll-content">
      <div className="cards">
        <h2 style={{ margin: 0 }}>Welcome Back, Eimi</h2>
        <Card>
          <h2>You have {messages.length} new messages</h2>
          <div className="actions">
            <div className="card-button">
              
            <a href="/messages">Go</a>
            </div>
          </div>
        </Card>
      </div>
    </div>
    {/* <Announcements /> */}
  </>
  );
}