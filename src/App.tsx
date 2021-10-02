import React, { ChangeEvent, FormEvent } from 'react';
import './App.css';

const HOST = "http://localhost:8080";

class Graph extends React.Component<any, any> {
  constructor(props : any) {
    super(props);
    this.state = {
      selected: null,
      mouse: null,
      edgeSelected: null,
    }
  }

  onSelectVertex(event: MouseEvent, index : number) {
    const vertex = this.props.vertices[index];
    const touchState = {
      vertex : index,
      startX : event.clientX - vertex.x,
      startY : event.clientY - vertex.y,
    }
    this.setState({selected : touchState})
  }

  static isWithinArea({cx, cy, r} : {cx : number, cy : number, r : number}, {x, y} : {x : number, y : number}) {
    return (cx - x) ** 2 + (cy - y) ** 2 <= r ** 2;
  }

  onDeselect() {
    if (this.state.edgeSelected) {
      const side = this.state.edgeSelected.side
      const otherSide = side === "in" ? "out" : "in";
      for (const i of Object.keys(this.props.vertices)) {
        const v2 = this.props.vertices[i];
        const v2Edge = Vertex.getEdgePosition(v2, otherSide);
        if (Graph.isWithinArea(v2Edge, this.state.mouse) && i !== this.state.edgeSelected.index) {
          if (side === "out") {
            this.props.addEdge({ from : this.state.edgeSelected.index, to : i })
          } else {
            this.props.addEdge({ from : i, to : this.state.edgeSelected.index })
          }
        }
      }
    }
    this.setState({selected : null, edgeSelected : null });
  }

  onSelectVertexEndpoint(index : number, side : "in" | "out") {
    this.setState({ edgeSelected : { index : index, side : side }});
  }

  onMouseMove(event: any) {
    this.setState({ mouse : { x: event.clientX, y: event.clientY }});
    if (this.state.selected) {
      const vertices = {...this.props.vertices};
      const vertex = vertices[this.state.selected.vertex];
      vertex.x = event.clientX - this.state.selected.startX;
      vertex.y = event.clientY - this.state.selected.startY;
      this.props.move(vertices);
    }
  }

  render() {
    const vertices = Object.values(this.props.vertices).map((vertex : any) => {
      const id = vertex.id;
      let x = vertex.x;
      let y = vertex.y;
      const highlight = id === this.props.clickedVertex;
      return (
        <Vertex x={x} y={y} key={id} name={vertex.name} highlight={highlight}
          onClick={() => this.props.onVertexSelect(id)}
          onSelectVertex={(event : MouseEvent) => this.onSelectVertex(event, id)}
          onDeselectVertex={() => this.onDeselect()}
          onSelectVertexEndpoint={(side : "in" | "out") => this.onSelectVertexEndpoint(id, side)}/>
      )
    });

    const edges : React.ReactElement[] = Object.values(this.props.edges).map(({from, to, id} : any) => {
      const p1 = Vertex.getEdgePosition(this.props.vertices[from], "out");
      const p2 = Vertex.getEdgePosition(this.props.vertices[to], "in");
      return <Edge key={id} xin={p1.cx} yin={p1.cy} xout={p2.cx} yout={p2.cy} />; 
    });

    if (this.state.edgeSelected && this.state.mouse) {
      const vertex = this.props.vertices[this.state.edgeSelected.index];
      if (this.state.edgeSelected.side === "in") {
        const edgePosition = Vertex.getEdgePosition(vertex, "in");
        edges.push(<Edge xin={this.state.mouse.x} yin={this.state.mouse.y} xout={edgePosition.cx} yout={edgePosition.cy} />)
      } else {
        const edgePosition = Vertex.getEdgePosition(vertex, "out");
        edges.push(<Edge key={0} xin={edgePosition.cx} yin={edgePosition.cy} xout={this.state.mouse.x} yout={this.state.mouse.y} />)
      }
    }

    return (
      <div className="graph" 
        onMouseMove={(event : any) => this.onMouseMove(event)} 
        onMouseLeave={() => this.onDeselect()}
        onMouseUp={() => this.onDeselect()}
      >
        <svg>
          {edges}
          {vertices}
        </svg>
      </div>
    )
  }
}

function Edge(props : any) {
  return (
    <line x1={props.xin} y1={props.yin} x2={props.xout} y2={props.yout} 
      stroke="black"
      strokeWidth="3"
    />
  )
}

class Vertex extends React.Component<any, any> {
  static width = 160;
  static height = 50;
  static background = "white";
  static foreground = "black";
  static highlight = "red";
  static strokeWidth = 3;

  constructor(props : any) {
    super(props);
    this.state = {
      edgeHover : null,
    }
  }

  static getEdgePosition(position : {x : number, y : number }, side : "in" | "out") {
    if (side === "in") {
      return {cx : position.x, cy : position.y + Vertex.height/2, r : Vertex.height/4}
    } else {
      return {cx : position.x + Vertex.width, cy : position.y + Vertex.height/2, r : Vertex.height/4}
    }
  }

  render() {
    return (
      <g>
        <rect 
        x={this.props.x} 
        y={this.props.y}
        onClick={this.props.onClick}
        onMouseDown={this.props.onSelectVertex}
        onMouseUp={this.props.onDeselectVertex}
        width={Vertex.width}
        height={Vertex.height} 
        fill={Vertex.background} 
        stroke={this.props.highlight ? Vertex.highlight : Vertex.foreground} 
        strokeWidth={Vertex.strokeWidth}
        />
        <text 
        x={this.props.x + Vertex.width/2} 
        y={this.props.y + Vertex.height/2} 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fill={Vertex.foreground} 
        fontSize="18"
        width={Vertex.width - Vertex.height}
        fontFamily="source-code-pro, Menlo, Monaco, Consolas">
          {this.props.name}
        </text>
        <circle
        onMouseEnter={() => this.setState({edgeHover : "in"})}
        onMouseLeave={() => this.setState({edgeHover : null})}
        onMouseDown={() => this.props.onSelectVertexEndpoint("in")}
        cx={this.props.x}
        cy={this.props.y + Vertex.height/2}
        r={Vertex.height/4}
        fill={this.state.edgeHover === "in" ? Vertex.highlight : Vertex.foreground}
        />
        <circle
        onMouseEnter={() => this.setState({edgeHover : "out"})}
        onMouseLeave={() => this.setState({edgeHover : null})}
        onMouseDown={() => this.props.onSelectVertexEndpoint("out")}
        cx={this.props.x + Vertex.width}
        cy={this.props.y + Vertex.height/2}
        r={Vertex.height/4}
        fill={this.state.edgeHover === "out" ? Vertex.highlight : Vertex.foreground}
        />
      </g>
    )
  }
}

class InfoField extends React.Component<any, any> {
  constructor(props : any) {
    super(props);
    this.state = {
      value : '',
      editing: false,
    }
  }

  handleChange(event : ChangeEvent<HTMLInputElement>) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event : FormEvent<HTMLFormElement>) {
    this.props.onChange(this.state.value);
    this.setState({editing : false, value : ''});
    event.preventDefault();
  }

  handleEdit() {
    this.setState({editing : true});
  }

  render() {
    if (this.state.editing) {
      return (
        <form className="info-field" onSubmit={event => this.handleSubmit(event)}>
          <label>{this.props.field}</label>
          <input autoFocus className="content" type="text" value={this.state.value} onChange={event => this.handleChange(event)}></input>
          <button className="edit">submit</button>
        </form>
      )
    } else {
      return (
        <div className="info-field">
          <label>{this.props.field}</label>
          <p className="content">{this.props.content}</p>
          <button className="edit" onClick={() => this.handleEdit()}>edit</button>
        </div>
      )
    }
  }

}

class InfoBar extends React.Component<any, any> {

  constructor(props : any) {
    super(props);
    this.state = {
      editName : false,
      editCode : false,
    }
  }

  render() {
    const vertex = this.props.vertex
    if (vertex) {
      return <div className="vertex-info">
        <div className="info-field">
          <label>id</label>
          <p className="content edit">{vertex.id}</p>
        </div>
        <InfoField field="name" content={vertex.name} onChange={(name : string) => this.props.changeName(name)}/>
        <InfoField field="code" content={vertex.code} onChange={(code : string) => this.props.changeCode(code)}/>
      </div>
    }
    return <div className="vertex-info">
      <p>Select a Vertex</p>
    </div>
  }
}

class Console extends React.Component<any, any> {

  private messagesEnd : HTMLElement | null = null;

  constructor(props : any) {
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

  onScroll(e : any) {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      this.setState({ userScroll : false })
    } else {
      this.setState({ userScroll : true })
    }
  }

  render() {
    const lines = this.props.log
      .map((line:any) => <ConsoleLine key={line.timestamp} timestamp={line.timestamp} message={line.message}/>)
    return (
      <div className="consoleWindow" onScroll={scrollEvent => this.onScroll(scrollEvent)}>
        <div className="logLines">
          {lines}
        </div>
        <div style={{ float:"left", clear: "both" }}
               ref={(el) => { this.messagesEnd = el; }}>
        </div>
      </div>
    );
  }
}

function ConsoleLine({timestamp, message} : {timestamp : number, message : string}) {
  const date = new Date(timestamp * 1e3);
  const timeString = date.toISOString();

  return (
    <div className="consoleLine">
      <span className="timestamp">{timeString}</span>
      <span className="message">{message}</span>
    </div>
  )
}

class App extends React.Component<{}, any> {

  private ws? : WebSocket = undefined;

  constructor(props: {}) {
    super(props);
    this.state = {
      vertices: {},
      edges: [],
      selectedVertex: null,
      log: [],
    };
  }

  componentDidMount() {
    this.ws = new WebSocket("ws://localhost:8080/ws");
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const logMessages = this.state.log;
      logMessages.push(msg);
      this.setState({ log : logMessages });
    };
    fetch(HOST + "/state")
      .then(response => response.json())
      .then(body => {
        console.log(body);
      })
  }

  addVertex() {
    const code = "NumberSource";
    fetch(HOST + "/createvertex", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name : null, code : code}),
    })
    .then(response => response.json())
    .then(body => {
      const description = body.description;
      if (description.id) {
        const vertices = {...this.state.vertices};
        vertices[description.id] = {...description, x : 100, y : 100};
        this.setState({vertices: vertices});
      }
    })
  }
  
  addEdge({ from, to } : { from : number, to : number }) {
    fetch(HOST + "/link", {
      method : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({source : from, target : to})
    })
    .then(response => response.json())
    .then(body => {
      const edges = {...this.state.edges};
      edges[body.id] = { from : from, to : to, id: body.id };
      this.setState({ edges : edges});
    })
  }

  changeName(newName : string) {
    const id = this.state.selectedVertex;
    fetch(HOST + "/name/" + id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({name : newName})
    }).then(response => response.json())
    .then(vertex => {
      const vertices = {...this.state.vertices};
      const old = vertices[vertex.id];
      vertices[vertex.id] = {...old, ...vertex};
      this.setState({vertices : vertices});
    })
  }

  changeCode(newCode : string) {
    const id = this.state.selectedVertex;
    fetch(HOST + "/code/" + id, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({code : newCode})
    })
    .then(response => response.json())
    .then(vertex => {
      const vertices = {...this.state.vertices};
      const old = vertices[vertex.id];
      vertices[vertex.id] = {...old, ...vertex};
      this.setState({vertices : vertices, log : []});
    })
  }

  selectVertex(id : string) {
    if (this.state.selectedVertex && (this.state.selectedVertex === id)) {
      return;
    }
    this.setState({ selectedVertex : id, log : [] });
    this.ws?.send(id);
  }

  render() {
    return (
      <div className="App">
        <Graph 
          vertices={this.state.vertices} 
          edges={this.state.edges}
          onVertexSelect={(id : string) => this.selectVertex(id)}
          clickedVertex={this.state.selectedVertex}
          move={(vertices : any) => this.setState({ vertices : vertices })}
          addEdge={(edge : any) => this.addEdge(edge)}
        />
        <div className="console"> 
          <Console log={this.state.log} />
        </div>
        <div className="infobar">
          <div>
            <div className="title">
              <h2>Vertex Info</h2>
            </div>
            <InfoBar 
              vertex={this.state.vertices[this.state.selectedVertex]} 
              changeName={(newName : string) => this.changeName(newName)} 
              changeCode={(newCode : string) => this.changeCode(newCode)} />
          </div>
          <div className="new-vertex">
            <button id="new-vertex" onClick={() => this.addVertex()}>New Vertex</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
