export type Vertex = {
  id : string,
  name : string,
  code : string,
  x : number,
  y : number,
  mps : number,
}

export type Vertices = Record<string, Vertex>

export type Edge = {
  from : string,
  to : string,
  id : string,
}

export type Graph = {
  vertices : Vertices,
  edges : Edge[],
}

export type LogMessage = { 
  timestamp: number, 
  message: string 
}