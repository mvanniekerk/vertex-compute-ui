import React from 'react';
import './App.css';

class Graph extends React.Component<any, any> {
  constructor(props : any) {
    super(props);
    this.state = {
      vertices: [{x: 50, y: 20, name: "test vertex"}],
      selected: null,
      mouse: null,
    }
  }

  addVertex(name : string) {
    const vertices = this.state.vertices.slice();
    vertices.push({x: 100, y: 50, name : name});
    this.setState({vertices : vertices});
  }

  onVertexMouseDown(event: MouseEvent, index : number) {
    const touchState = {
      vertex : index,
      startX : event.clientX,
      startY : event.clientY,
    }
    this.setState({selected : touchState})
  }

  onVertexMouseUp() {
    const vertices = this.state.vertices.slice();
    const vertex = vertices[this.state.selected.vertex];
    vertex.x += this.state.mouse.x - this.state.selected.startX;
    vertex.y += this.state.mouse.y - this.state.selected.startY;
    this.setState({selected : null, vertices : vertices})
  }

  onMouseMove(event: any) {
    this.setState({mouse : {x : event.clientX, y : event.clientY}});
  }

  render() {
    const vertices = this.state.vertices.map((v : any, index : number) => {
      let x = v.x;
      let y = v.y;
      if (this.state.selected && this.state.mouse && this.state.selected.vertex === index) {
        x += this.state.mouse.x - this.state.selected.startX;
        y += this.state.mouse.y - this.state.selected.startY;
      } 
      return (
        <Vertex x={x} y={y} key={index} 
          onMouseDown={(event : MouseEvent) => this.onVertexMouseDown(event, index)}
          onMouseUp={() => this.onVertexMouseUp()}/>
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
  return (
    <rect 
      x={props.x} 
      y={props.y}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      width="150" 
      height="100" 
      fill="white" 
      stroke="black" 
      strokeWidth="3" 
    />
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
    vertices.push({id : this.state.id, name : "New Vertex"});
    this.setState({vertices: vertices, id: this.state.id + 1});
  }

  render() {
    return (
      <div className="App">
        <Graph vertices={this.state.vertices}/>
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
