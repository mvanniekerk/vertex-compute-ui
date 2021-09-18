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
    const vertex = this.props.vertices[index];
    const touchState = {
      vertex : index,
      startX : event.clientX - vertex.x,
      startY : event.clientY - vertex.y,
    }
    this.setState({selected : touchState})
  }

  onDeselectVertex() {
    this.setState({selected : null});
  }

  onMouseMove(event: any) {
    if (this.state.selected) {
      const vertices = this.props.vertices.slice();
      const vertex = vertices[this.state.selected.vertex];
      vertex.x = event.clientX - this.state.selected.startX;
      vertex.y = event.clientY - this.state.selected.startY;
      this.props.move(vertices);
    }
  }

  render() {
    const vertices = this.props.vertices.map((v : any) => {
      const ind = v.id;
      let x = v.x;
      let y = v.y;
      return (
        <Vertex x={x} y={y} key={ind} name={v.name}
          onMouseDown={(event : MouseEvent) => this.onSelectVertex(event, ind)}
          onMouseUp={() => this.onDeselectVertex()}/>
      )
    });

    return (
      <div className="graph" onMouseMove={(event : any) => this.onMouseMove(event)} onMouseLeave={() => this.onDeselectVertex()}>
        <svg>
          {vertices}
        </svg>
      </div>
    )
  }
}

function Edge(props : any) {

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
