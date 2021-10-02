import React from "react";

export class Console extends React.Component<any, any> {

  private messagesEnd: HTMLElement | null = null;

  constructor(props: any) {
    super(props);
    this.state = {
      userScroll: false,
    }
  }

  scrollToBottom() {
    if (this.state.userScroll) {
      return;
    }
    this.messagesEnd?.scrollIntoView();
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  onScroll(e: any) {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      this.setState({ userScroll: false })
    } else {
      this.setState({ userScroll: true })
    }
  }

  render() {
    const lines = this.props.log
      .map((line: any) => <ConsoleLine key={line.timestamp} timestamp={line.timestamp} message={line.message} />)
    return (
      <div className="consoleWindow" onScroll={scrollEvent => this.onScroll(scrollEvent)}>
        <div className="logLines">
          {lines}
        </div>
        <div style={{ float: "left", clear: "both" }}
          ref={(el) => { this.messagesEnd = el; }}>
        </div>
      </div>
    );
  }
}

function ConsoleLine({ timestamp, message }: { timestamp: number, message: string }) {
  const date = new Date(timestamp * 1e3);
  const timeString = date.toISOString();

  return (
    <div className="consoleLine">
      <span className="timestamp">{timeString}</span>
      <span className="message">{message}</span>
    </div>
  )
}