export interface PathStep {
  deltaLength: number;
  radius: number;
  rotation: number;
  heading: number;
}

export interface PathAnalysis {
  length: number;
  minRadius: number;
  tangentRotation: number;
  netRotation: number;
  steps: PathStep[];
  startHeading: number;
}
