import type {
  SequenceItem,
  Point,
  ControlPoint,
  TurtleData,
  SequencePathItem,
  SequenceWaitItem,
  SequenceRotateItem,
  Transformation,
  Line
} from "../../types";
import { translatePathData, rotatePathData, flipPathData } from "../pathTransform";
export type PreprocessedItem = SequenceItem;

export class SequencePreprocessor {
  private visitedMacros = new Set<string>();
  constructor(private macros?: Map<string, TurtleData>) {}

  public process(
    sequence: SequenceItem[],
    globalReverse: boolean = false,
    transformations: Transformation[] = []
  ): PreprocessedItem[] {
    const result: PreprocessedItem[] = [];
    for (const item of sequence) {
      if ((item as any).type === "macro") {
        if (!(item as any).filePath || this.visitedMacros.has((item as any).filePath)) continue;
        this.visitedMacros.add((item as any).filePath);
        let expandedSequence: SequenceItem[] = [];
        if ((item as any).sequence && (item as any).sequence.length > 0) expandedSequence = (item as any).sequence;
        else if (this.macros && this.macros.has((item as any).filePath)) {
          const macroData = this.macros.get((item as any).filePath);
          if (macroData && macroData.sequence) expandedSequence = macroData.sequence;
        }
        const combinedTransformations = [...transformations, ...((item as any).transformations || [])];
        const subItems = this.process(expandedSequence, globalReverse, combinedTransformations);
        result.push(...subItems);
        this.visitedMacros.delete((item as any).filePath);
      } else {
        const itemCopy = JSON.parse(JSON.stringify(item)) as PreprocessedItem;
        if ('reverse' in itemCopy) itemCopy.reverse = !!(globalReverse !== itemCopy.reverse);
        if (transformations.length > 0 && "atPoint" in itemCopy && itemCopy.atPoint) {
            let tempPoint = Object.assign({}, itemCopy.atPoint) as Point;
            for (const t of transformations) {
                const tempLines: Line[] = [];
                if ((t as any).type === "translate" && (t as any).x !== undefined && (t as any).y !== undefined) {
                    const res = translatePathData({startPoint: tempPoint, lines: tempLines}, (t as any).x, (t as any).y);
                    tempPoint = res.startPoint;
                } else if ((t as any).type === "rotate" && (t as any).angle !== undefined && (t as any).origin) {
                    const res = rotatePathData({startPoint: tempPoint, lines: tempLines}, (t as any).angle, (t as any).origin?.x || 0, (t as any).origin?.y || 0);
                    tempPoint = res.startPoint;
                } else if ((t as any).type === "flip" && (t as any).axis !== undefined && (t as any).origin) {
                    const res = flipPathData({startPoint: tempPoint, lines: tempLines}, (t as any).axis === "horizontal" || (t as any).axis === "both", (t as any).axis === "vertical" || (t as any).axis === "both", (t as any).origin?.x || 0, (t as any).origin?.y || 0);
                    tempPoint = res.startPoint;
                }
            }
            itemCopy.atPoint = tempPoint;
        }
        result.push(itemCopy);
      }
    }
    return result;
  }
}