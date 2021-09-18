import React from 'react';
import './App.css';

class Graph extends React.Component<any, any> {
  constructor(props : any) {
    super(props);
    this.state = {
      selected: null,
      mouse: null,
    }
  }

  onSelectVertex(event: MouseEvent, index : number) {
    const touchState = {
      vertex : index,
      startX : event.clientX,
      startY : event.clientY,
    }
    this.setState({selected : touchState})
  }

  onDeselectVertex() {
    const vertices = this.props.vertices.slice();
    const vertex = vertices[this.state.selected.vertex];
    vertex.x += this.state.mouse.x - this.state.selected.startX;
    vertex.y += this.state.mouse.y - this.state.selected.startY;
    this.setState({selected : null});
    this.props.move(vertices);
  }

  onMouseMove(event: any) {
    this.setState({mouse : {x : event.clientX, y : event.clientY}});
  }

  render() {
    const vertices = this.props.vertices.map((v : any) => {
      const index = v.id;
      let x = v.x;
      let y = v.y;
      if (this.state.selected && this.state.mouse && this.state.selected.vertex === index) {
        x += this.state.mouse.x - this.state.selected.startX;
        y += this.state.mouse.y - this.state.selected.startY;
      } 
      return (
        <Vertex x={x} y={y} key={index} name={v.name}
          onMouseDown={(event : MouseEvent) => this.onSelectVertex(event, index)}
          onMouseUp={() => this.onDeselectVertex()}/>
      )
    });

    return (
      <div className="graph" onMouseMove={(event : any) => this.onMouseMove(event)}>
        <svg>
          {vertices}
        </svg>
      </div>
    )
  }
}

function Vertex(props : any) {
  const width = 150;
  const height = 50;
  return (
    <g>
      <rect 
      x={props.x} 
      y={props.y}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      width={width}
      height={height} 
      fill="white" 
      stroke="black" 
      strokeWidth="3" 
      />
      <text x={props.x + width/2} y={props.y + height/2} dominant-baseline="middle" text-anchor="middle" fill="black" fontSize="18">
          {props.name}</text>
    </g>
  )
}

class App extends React.Component<{}, any> {

  constructor(props: {}) {
    super(props);
    this.state = {
      vertices: [],
      id : 0,
    };
  }

  addVertex() {
    const vertices = this.state.vertices.slice();
    vertices.push({id : this.state.id, name : "New Vertex", x : 100, y : 100});
    this.setState({vertices: vertices, id: this.state.id + 1});
  }

  render() {
    return (
      <div className="App">
        <Graph vertices={this.state.vertices} move={(vertices : any) => this.setState({ vertices : vertices })}/>
        <div className="console"> 
          Console goes here.
        </div>
        <div className="infobar">
          <div className="vertex-info">Vertex Info</div>
          <div className="new-vertex">
            <button id="new-vertex" onClick={() => this.addVertex()}>New Vertex</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
