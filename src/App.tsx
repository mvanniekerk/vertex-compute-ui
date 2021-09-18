import React from 'react';
import './App.css';
import ForceGraph2D from 'react-force-graph-2d';
import { withSize } from 'react-sizeme';

class SizeTest extends React.Component<any, any> {
  render() {
    console.log(this.props.size);
    return (
      <ForceGraph2D 
        width={this.props.size.width} 
        height={this.props.size.height} 
        graphData={{nodes: this.props.vertices, links: []}}
        backgroundColor="black"
      />
    )
  }
}

const SizeTestC = withSize({monitorHeight : true })(SizeTest);

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
        <div className="graph">
          <SizeTestC vertices={this.state.vertices} />
        </div>
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
