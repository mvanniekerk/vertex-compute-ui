import React from 'react';
import { Graph, Vertices } from './Types';

type GraphProps = Graph & {
  addEdge: (from: string, to: string) => void,
  move: (vertices: Vertices) => void,
  onVertexSelect: (vertexId: string) => void,
  clickedVertex: string | undefined,
}

type GraphState = {
  selected: { vertex: string, startX: number, startY: number } | undefined,
  mouse: { x: number, y: number } | undefined,
  edgeSelected: { index: string, side: "in" | "out" } | undefined,
}

export class GraphView extends React.Component<GraphProps, GraphState> {
  constructor(props: GraphProps) {
    super(props);
    this.state = {
      selected: undefined,
      mouse: undefined,
      edgeSelected: undefined,
    }
  }

  onSelectVertex(event: MouseEvent, id: string) {
    const vertex = this.getVertex(id);
    const touchState = {
      vertex: id,
      startX: event.clientX - vertex.x,
      startY: event.clientY - vertex.y,
    }
    this.setState({ selected: touchState })
  }

  static isWithinArea({ cx, cy, r }: { cx: number, cy: number, r: number }, { x, y }: { x: number, y: number }) {
    return (cx - x) ** 2 + (cy - y) ** 2 <= r ** 2;
  }

  onDeselect() {
    if (this.state.mouse && this.state.edgeSelected) {
      const side = this.state.edgeSelected.side
      const otherSide = side === "in" ? "out" : "in";
      for (const id of Object.keys(this.props.vertices)) {
        const v2 = this.getVertex(id);
        const v2Edge = VertexView.getEdgePosition(v2, otherSide);
        if (GraphView.isWithinArea(v2Edge, this.state.mouse) && id !== this.state.edgeSelected.index) {
          if (side === "out") {
            this.props.addEdge(this.state.edgeSelected.index, id);
          } else {
            this.props.addEdge(id, this.state.edgeSelected.index);
          }
        }
      }
    }
    this.setState({ selected: undefined, edgeSelected: undefined });
  }

  onSelectVertexEndpoint(index: string, side: "in" | "out") {
    this.setState({ edgeSelected: { index: index, side: side } });
  }

  onMouseMove(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    this.setState({ mouse: { x: event.clientX, y: event.clientY } });
    if (this.state.selected) {
      const vertices = { ...this.props.vertices };
      const vertex = this.getVertex(this.state.selected.vertex);
      vertex.x = event.clientX - this.state.selected.startX;
      vertex.y = event.clientY - this.state.selected.startY;
      this.props.move(vertices);
    }
  }

  getVertex(id: string) {
    const vertex = this.props.vertices[id];
    if (!vertex) {
      throw new Error(`Id ${id} is not a vertex in ${this.props.vertices}`);
    }
    return vertex;
  }

  render() {
    const vertices = Object.values(this.props.vertices).map(vertex => {
      const id = vertex.id;
      let x = vertex.x;
      let y = vertex.y;
      const highlight = id === this.props.clickedVertex;
      return (
        <VertexView x={x} y={y} key={id} name={vertex.name} highlight={highlight}
          onClick={() => this.props.onVertexSelect(id)}
          onSelectVertex={(event: MouseEvent) => this.onSelectVertex(event, id)}
          onDeselectVertex={() => this.onDeselect()}
          onSelectVertexEndpoint={(side: "in" | "out") => this.onSelectVertexEndpoint(id, side)} />
      )
    });

    const edges: React.ReactElement[] = Object.values(this.props.edges).map(({ from, to, id }) => {
      const fromV = this.getVertex(from);
      const p1 = VertexView.getEdgePosition(fromV, "out");
      const p2 = VertexView.getEdgePosition(this.getVertex(to), "in");
      return <EdgeView key={id} xin={p1.cx} yin={p1.cy} xout={p2.cx} yout={p2.cy} mps={fromV.mps}/>;
    });

    if (this.state.edgeSelected && this.state.mouse) {
      const vertex = this.getVertex(this.state.edgeSelected.index);
      if (this.state.edgeSelected.side === "in") {
        const edgePosition = VertexView.getEdgePosition(vertex, "in");
        edges.push(<EdgeView xin={this.state.mouse.x} yin={this.state.mouse.y} xout={edgePosition.cx} yout={edgePosition.cy} mps={0}/>)
      } else {
        const edgePosition = VertexView.getEdgePosition(vertex, "out");
        edges.push(<EdgeView key={0} xin={edgePosition.cx} yin={edgePosition.cy} xout={this.state.mouse.x} yout={this.state.mouse.y} mps={0}/>)
      }
    }

    return (
      <div className="graph"
        onMouseMove={(event) => this.onMouseMove(event)}
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

function EdgeView(props: any) {
  const radius = 5;
  let duration;
  let numCircles;
  if (props.mps === 0) {
    duration = 0;
    numCircles = 0;
  } else {
    const rate = Math.floor(Math.log2(props.mps + 1) + 1);
    duration = 5.0 / rate;
    numCircles = 2;
  }

  const circles = [];
  for (let i = 0; i < numCircles; i++) {
    const circle = (
      <circle r={radius} fill="red">
        <animate attributeName="cx" values={props.xin + ";" + props.xout} dur={duration} begin={duration / numCircles * i} repeatCount="indefinite" />
        <animate attributeName="cy" values={props.yin + ";" + props.yout} dur={duration} begin={duration / numCircles * i} repeatCount="indefinite" />
      </circle>
    )
    circles.push(circle);
  }
  return (
    <g>
      <line x1={props.xin} y1={props.yin} x2={props.xout} y2={props.yout}
        stroke="black"
        strokeWidth="3"
      />
      {circles}
    </g>
  )
}

class VertexView extends React.Component<any, any> {
  static width = 160;
  static height = 50;
  static background = "white";
  static foreground = "black";
  static highlight = "red";
  static strokeWidth = 3;

  constructor(props: any) {
    super(props);
    this.state = {
      edgeHover: null,
    }
  }

  static getEdgePosition(position: { x: number, y: number }, side: "in" | "out") {
    if (side === "in") {
      return { cx: position.x, cy: position.y + VertexView.height / 2, r: VertexView.height / 4 }
    } else {
      return { cx: position.x + VertexView.width, cy: position.y + VertexView.height / 2, r: VertexView.height / 4 }
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
          width={VertexView.width}
          height={VertexView.height}
          fill={VertexView.background}
          stroke={this.props.highlight ? VertexView.highlight : VertexView.foreground}
          strokeWidth={VertexView.strokeWidth}
        />
        <text
          x={this.props.x + VertexView.width / 2}
          y={this.props.y + VertexView.height / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={VertexView.foreground}
          fontSize="18"
          width={VertexView.width - VertexView.height}
          fontFamily="source-code-pro, Menlo, Monaco, Consolas">
          {this.props.name}
        </text>
        <circle
          onMouseEnter={() => this.setState({ edgeHover: "in" })}
          onMouseLeave={() => this.setState({ edgeHover: null })}
          onMouseDown={() => this.props.onSelectVertexEndpoint("in")}
          cx={this.props.x}
          cy={this.props.y + VertexView.height / 2}
          r={VertexView.height / 4}
          fill={this.state.edgeHover === "in" ? VertexView.highlight : VertexView.foreground}
        />
        <circle
          onMouseEnter={() => this.setState({ edgeHover: "out" })}
          onMouseLeave={() => this.setState({ edgeHover: null })}
          onMouseDown={() => this.props.onSelectVertexEndpoint("out")}
          cx={this.props.x + VertexView.width}
          cy={this.props.y + VertexView.height / 2}
          r={VertexView.height / 4}
          fill={this.state.edgeHover === "out" ? VertexView.highlight : VertexView.foreground}
        />
      </g>
    )
  }
}