import React from 'react';
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
      const ind = vertex.id;
      let x = vertex.x;
      let y = vertex.y;
      const highlight = ind === this.props.clickedVertex;
      return (
        <Vertex x={x} y={y} key={ind} name={vertex.name} highlight={highlight}
          onClick={() => this.props.onVertexSelect(ind)}
          onSelectVertex={(event : MouseEvent) => this.onSelectVertex(event, ind)}
          onDeselectVertex={() => this.onDeselect()}
          onSelectVertexEndpoint={(side : "in" | "out") => this.onSelectVertexEndpoint(ind, side)}/>
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
  static width = 150;
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

class InfoBar extends React.Component<any, any> {

  constructor(props : any) {
    super(props);
    this.state = {

    }
  }

  render() {
    const vertex = this.props.vertex
    if (vertex) {
      return <div className="vertex-info">
        <div className="name">
          <label>name:</label>
          <p>{vertex.name}</p>
        </div>
        
      </div>
    }
    return <div className="vertex-info">
      <p>Select a Vertex</p>
    </div>
  }
}

class App extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.state = {
      vertices: {},
      edges: [],
      selectedVertex: null
    };
  }

  addVertex() {
    const name = "New Vertex";
    fetch(HOST + "/createvertex", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name : name}),
    })
    .then(response => response.json())
    .then(body => {
      if (body.id) {
        const vertices = {...this.state.vertices};
        vertices[body.id] = {id : body.id, name : "New Vertex", x : 100, y : 100};
        this.setState({vertices: vertices});
      }
    })
  }
  
  addEdge({ from, to } : { from : number, to : number }) {
    console.log("add edge " + from + " to " + to);
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

  render() {
    return (
      <div className="App">
        <Graph 
          vertices={this.state.vertices} 
          edges={this.state.edges}
          onVertexSelect={(id : number) => this.setState({ selectedVertex : id })}
          clickedVertex={this.state.selectedVertex}
          move={(vertices : any) => this.setState({ vertices : vertices })}
          addEdge={(edge : any) => this.addEdge(edge)}
        />
        <div className="console"> 
          Console goes here.
        </div>
        <div className="infobar">
          <div>
            <div className="title">
              <h2>Vertex Info</h2>
            </div>
            <InfoBar vertex={this.state.vertices[this.state.selectedVertex]} />
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
